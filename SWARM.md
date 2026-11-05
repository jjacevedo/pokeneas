# Despliegue de Pokeneas en AWS con Docker Swarm

Guía para montar el cluster completo en una cuenta del Learner Lab: 4 instancias EC2, Docker Swarm y 10 réplicas.
Reemplaza `<USUARIO>` por el usuario de DockerHub de quien publicó la imagen y `<BUCKET>` por el bucket de S3.

Prerrequisitos: la imagen `<USUARIO>/pokeneas:latest` ya está en DockerHub (revisar la pestaña Actions del repo) y las imágenes ya están en S3.

## 1. Bucket de S3 con las imágenes

Consola: S3 > Create bucket > nombre `<BUCKET>` (único), región us-east-2. Desmarcar **Block all public access** y confirmar.

Política del bucket (Permissions > Bucket policy), solo lectura:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LecturaPublica",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET>/*"
    }
  ]
}
```

Subir las imágenes (desde la carpeta del repo, con AWS CLI configurado, o arrastrándolas en la consola):

```bash
aws s3 sync assets/pokeneas s3://<BUCKET>/pokeneas/
```

URL pública de cada imagen (probarla en el navegador):

```
https://<BUCKET>.s3.amazonaws.com/pokeneas/<archivo>.png
```

La URL base que usa la app es `https://<BUCKET>.s3.amazonaws.com/pokeneas` (variable `IMAGES_BASE_URL`).

## 2. Security group `pokeneas-swarm-sg`

EC2 > Security Groups > Create (en la VPC por defecto). Reglas de entrada:

| Tipo | Protocolo | Puerto | Origen |
|---|---|---|---|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| SSH | TCP | 22 | 0.0.0.0/0 |
| Personalizada | TCP | 2377 | el propio security group |
| Personalizada | TCP | 7946 | el propio security group |
| Personalizada | UDP | 7946 | el propio security group |
| Personalizada | UDP | 4789 | el propio security group |

Las cuatro últimas se agregan después de crear el grupo, para poder elegirlo a sí mismo como origen.

Con CLI (alternativa):

```bash
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG=$(aws ec2 create-security-group --group-name pokeneas-swarm-sg --description "Pokeneas Swarm" --vpc-id $VPC --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 2377 --source-group $SG
aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 7946 --source-group $SG
aws ec2 authorize-security-group-ingress --group-id $SG --protocol udp --port 7946 --source-group $SG
aws ec2 authorize-security-group-ingress --group-id $SG --protocol udp --port 4789 --source-group $SG
```

## 3. Launch template `pokeneas-template`

EC2 > Launch Templates > Create:

- AMI: Amazon Linux 2023
- Tipo: t2.micro (o t3.micro)
- Par de llaves: `vockey`
- Security group: `pokeneas-swarm-sg`
- Advanced details > User data:

```bash
#!/bin/bash
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user
```

Con CLI (alternativa):

```bash
AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --query Parameter.Value --output text)
UD=$(printf '#!/bin/bash\ndnf install -y docker\nsystemctl enable --now docker\nusermod -aG docker ec2-user\n' | base64 -w0)
aws ec2 create-launch-template --launch-template-name pokeneas-template \
  --launch-template-data "{\"ImageId\":\"$AMI\",\"InstanceType\":\"t3.micro\",\"KeyName\":\"vockey\",\"SecurityGroupIds\":[\"$SG\"],\"UserData\":\"$UD\"}"
```

## 4. Lanzar 4 instancias

EC2 > Launch Templates > `pokeneas-template` > Actions > Launch instance from template, con **Number of instances = 4**. Ponerles nombre: `lider`, `nodo2`, `nodo3`, `nodo4`.

Con CLI:

```bash
aws ec2 run-instances --launch-template LaunchTemplateName=pokeneas-template --count 4
```

Esperar 1 o 2 minutos a que el user data termine de instalar Docker. Conectarse a cada una por SSH (EC2 Instance Connect desde la consola o `ssh -i labsuser.pem ec2-user@<IP_PUBLICA>`) y comprobar:

```bash
docker --version
docker ps
```

Si `docker ps` dice permiso denegado, cerrar la sesión y volver a entrar (el grupo `docker` se aplica en el siguiente login).

## 5. Armar el Swarm

En la **líder**, con su IP privada (la que sale en la consola de EC2, algo como 172.31.x.x):

```bash
docker swarm init --advertise-addr <IP_PRIVADA_LIDER>
docker swarm join-token manager
```

El segundo comando imprime una línea como esta. Copiarla completa:

```bash
docker swarm join --token SWMTKN-1-xxxx <IP_PRIVADA_LIDER>:2377
```

En cada una de las **otras 3** instancias, pegar esa línea.

Verificar en la líder:

```bash
docker node ls
```

Deben salir 4 nodos en estado `Ready`, uno de ellos `Leader`.

## 6. Crear el servicio con 10 réplicas

En la líder:

```bash
docker service create \
  --name pokeneas \
  --replicas 10 \
  -p 80:80 \
  -e IMAGES_BASE_URL=https://<BUCKET>.s3.amazonaws.com/pokeneas \
  <USUARIO>/pokeneas:latest
```

## 7. Verificación

```bash
docker service ls
docker service ps pokeneas
curl http://localhost/api/pokenea
curl http://localhost/api/pokenea
```

- `docker service ps pokeneas` debe mostrar 10 tareas en `Running`, repartidas entre los 4 nodos. **Esta es la captura de la consola.**
- Los dos `curl` deben traer un Pokenea y un campo `contenedor` que cambia entre llamadas.
- En el navegador: `http://<IP_PUBLICA_LIDER>/`, `/api/pokenea` y `/pokenea`. Recargar varias veces y comprobar que el id del contenedor cambia y que la imagen carga desde S3. Tomar dos capturas de `/pokenea` con ids distintos.

Cualquier nodo del Swarm responde en el puerto 80, no solo la líder.

## Actualizar a una imagen nueva

Cuando el workflow publique una versión nueva:

```bash
docker service update --image <USUARIO>/pokeneas:latest --force pokeneas
```

## Problemas frecuentes

- **Las réplicas se quedan en `Pending` o `Rejected`:** revisar que el usuario de DockerHub esté bien escrito y que el repositorio sea público.
- **Los nodos no se unen:** revisar las reglas de entrada del security group (2377, 7946 TCP/UDP, 4789 UDP con origen el propio grupo) y usar la IP **privada** de la líder.
- **Las imágenes no cargan:** abrir una URL de S3 directamente; si da 403, falta la política del bucket o el bloqueo de acceso público sigue activo. Revisar también `IMAGES_BASE_URL` (sin `/` al final).
- **Learner Lab:** al terminar la sesión las instancias se apagan y la IP pública cambia al encenderlas. Si se reinician, la IP privada se conserva, pero revisar con `docker node ls` y `docker service ps pokeneas` que todo siga arriba, y anotar la IP pública nueva justo antes de entregar o sustentar.
