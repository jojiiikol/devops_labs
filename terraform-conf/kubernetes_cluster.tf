terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  folder_id                = var.folder_id
  service_account_key_file = "authorized_key.json"
  zone                     = var.zone
}

data "yandex_iam_service_account" "cluster-agent" {
  name = "clusters-agent"
}

data "yandex_iam_service_account" "docker-register-puller" {
  name = "docker-register-puller"
}

resource "yandex_vpc_network" "kluster-network" {
  name = "kluster-network"
}

resource "yandex_vpc_subnet" "k8s-subnet" {
  name = "k8s-subnet"
  v4_cidr_blocks = ["192.168.0.0/16"]
  zone           = var.zone
  network_id     = yandex_vpc_network.kluster-network.id
}

resource "yandex_kms_symmetric_key" "kms-key" {
  name              = "kms-key"
  default_algorithm = "AES_128"
  rotation_period   = "8760h"
}

resource "yandex_kubernetes_cluster" "k8s-labs-cluster" {
  name       = "k8s-labs-cluster"
  network_id = yandex_vpc_network.kluster-network.id
  master {
    master_location {
      zone      = var.zone
      subnet_id = yandex_vpc_subnet.k8s-subnet.id
    }
    security_group_ids = [yandex_vpc_security_group.k8s-public-services.id]
    public_ip = true
  }

  cluster_ipv4_range = "10.1.0.0/16"
  service_ipv4_range = "10.128.0.0/16"
  node_ipv4_cidr_mask_size = 24

  service_account_id      = data.yandex_iam_service_account.cluster-agent.id
  node_service_account_id = data.yandex_iam_service_account.docker-register-puller.id
  kms_provider {
    key_id = yandex_kms_symmetric_key.kms-key.id
  }
}

resource "yandex_vpc_security_group" "k8s-public-services" {
  name        = "k8s-public-services"
  network_id  = yandex_vpc_network.kluster-network.id
  ingress {
    protocol          = "TCP"
    description       = "Доступ к Kubernetes API из интернета"
    v4_cidr_blocks    = ["0.0.0.0/0"]
    port              = 443
  }

  ingress {
    protocol          = "TCP"
    description       = "Правило разрешает проверки доступности с диапазона адресов балансировщика нагрузки. Нужно для работы отказоустойчивого кластера Managed Service for Kubernetes и сервисов балансировщика."
    predefined_target = "loadbalancer_healthchecks"
    from_port         = 0
    to_port           = 65535
  }
  ingress {
    protocol          = "ANY"
    description       = "Правило разрешает взаимодействие мастер-узел и узел-узел внутри группы безопасности."
    predefined_target = "self_security_group"
    from_port         = 0
    to_port           = 65535
  }
  ingress {
    protocol    = "ANY"
    description = "Правило разрешает взаимодействие под-под и сервис-сервис. Укажите подсети вашего кластера Managed Service for Kubernetes и сервисов."
    v4_cidr_blocks = [
      "192.168.0.0/16",
      "10.1.0.0/16",
      "10.128.0.0/16"
    ]
    from_port = 0
    to_port   = 65535
  }
  ingress {
    protocol       = "ICMP"
    description    = "Правило разрешает отладочные ICMP-пакеты из внутренних подсетей."
    v4_cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
  }
  ingress {
    protocol       = "TCP"
    description    = "Правило разрешает входящий трафик из интернета на диапазон портов NodePort."
    v4_cidr_blocks = ["0.0.0.0/0"]
    from_port      = 30000
    to_port        = 32767
  }

  ingress {
    protocol       = "TCP"
    description    = "SSH доступ к узлам"
    v4_cidr_blocks = ["0.0.0.0/0"]
    port           = 22
  }


  ingress {
    protocol       = "ICMP"
    description    = "Ping для отладки"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    protocol       = "ANY"
    description    = "Правило разрешает весь исходящий трафик. Узлы могут связаться с Yandex Container Registry, Yandex Object Storage, Docker Hub и т. д."
    v4_cidr_blocks = ["0.0.0.0/0"]
    from_port      = 0
    to_port        = 65535
  }
}

resource "yandex_kubernetes_node_group" "k8s-nodes-group" {
  name        = "k8s-nodes-group"
  cluster_id  = yandex_kubernetes_cluster.k8s-labs-cluster.id
  version     = "1.32"
  instance_template {
    name = "node-{instance.short_id}-{instance_group.id}"
    platform_id = "standard-v1"
    resources {
      cores         = 2
      core_fraction = 100
      memory        = 2
    }
    boot_disk {
      size = 64
      type = "network-hdd"
    }
    network_acceleration_type = "standard"
    network_interface {
      security_group_ids = [yandex_vpc_security_group.k8s-public-services.id]
      subnet_ids         = [yandex_vpc_subnet.k8s-subnet.id]
      nat                = true
    }
    scheduling_policy {
      preemptible = false
    }
    metadata = {
      ssh-keys = "jojiiikol:${file("~/.ssh/id_ed25519.pub")}"
    }
  }
  scale_policy {
    auto_scale {
      min     = 3
      max     = 5
      initial = 3
    }
  }
  deploy_policy {
    max_expansion   = 3
    max_unavailable = 1
  }
  maintenance_policy {
    auto_upgrade = true
    auto_repair  = true
    maintenance_window {
      start_time = "22:00"
      duration   = "10h"
    }
  }
  allowed_unsafe_sysctls = ["kernel.msg*", "net.core.somaxconn"]
}





