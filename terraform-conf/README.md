# Настройка конфигурации Terraform + YC

## Настройка облака
[Замечательный гайд от Yandex](https://yandex.cloud/ru/docs/tutorials/infrastructure-management/terraform-quickstart#windows_2)

## Настройка конфигурации
### authorized_key.json
1) Создайте файл authorized_key.json по примеру authorized_key.example.json
2) В него необходимо вставить данные с сервисного аккаунта вашего облака

### user_data.txt
1) Создайте файл user_data.txt по примеру user_data.example.txt
2) Введите имя пользователя в вашей ВМ в поле ```name: <username_on_vm>```
3) Добавьте открытые ключи ssh в поле ```ssh_authorized_keys``` по которым вы будете подключаться к машине в дальнейшем 

### variables.tf
Добавьте значения зоны, id папки на облаке, семейство ОС в файл variables.tf

# Запуск
1) Проверьте конфигурацию командой ```terraform validate```
2) Просмотрите и проверьте ресурсы командой ```terraform plan```
3) Примените конфигурацию для создания ресурсов командой ```terraform apply```