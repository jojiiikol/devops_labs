# Управление машиной через ansible

## Установка
Проведите установку командой ```pip install ansible```, если до этого не была проведена установка пакетов из ```requirements.txt```

## Настройка
### Инвентарь
Настройте группу хостов в файле ```inventory.yaml```, указав ip хостов и юзера

## Запуск
1) Убедитесь, что вы в директории ansible
2) Запустите playbook командой ```ansible-playbook <ansible_playbook_filename.yaml> -i <inventory_filename.yaml> --private-key=<path_to_private_key>``` флаг private-key не обязателен.
3) ```install_docker.yaml``` - установка docker/docker-compose на сервер
4) ```run_app.yaml``` - запуск приложения на сервере
