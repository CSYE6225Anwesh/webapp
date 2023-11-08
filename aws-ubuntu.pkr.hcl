
packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}


variable "aws_access_key" {
  default = "AKIA2RWPKWOZVJURE7I6"
}
variable "aws_secret_key" {
  default = "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"
}


variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-06db4d78cb1d3bbf9"
}

variable "ssh_username" {
  type    = string
  default = "admin"
}

variable "subnet_id" {
  type    = string
  default = "subnet-0b0890f12082f88e5"
}

variable "instance_type" {
  default = "t2.micro"
}

variable "ami_description" {
  default = "AMI for CSYE 6225"
}

variable "profile" {
  type    = string
  default = "dev"
}



source "amazon-ebs" "custom-ami" {
  profile    = "${var.profile}"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = "${var.aws_region}"
  ami_users  = ["725210543027", "568681947239"]

  ami_name        = "csye6225_f23_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  instance_type   = "${var.instance_type}"
  source_ami      = "${var.source_ami}"
  ssh_username    = "${var.ssh_username}"
  ami_description = "${var.ami_description}"
  subnet_id       = "${var.subnet_id}"

  force_deregister = true
  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }
  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }

}


build {
  sources = [
    "source.amazon-ebs.custom-ami"
  ]


  // add a inline shell to copy userdata env file to webapp env

  provisioner "shell" {
    inline = [
      "sudo groupadd csye6225",
      "sudo useradd -s /bin/false -g csye6225 -d /opt/csye6225 -m csye6225",
      "mkdir -p ~/webapp/dist",
      "sudo apt update",
      "sudo apt install -y nodejs npm",
      "sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/debian/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i /tmp/amazon-cloudwatch-agent.deb",
    ]
  }



  // this needs to be commented
  // provisioner "file" {
  //   source      = fileexists(".env") ? ".env" : "/"
  //   destination = "/home/admin/webapp/.env"
  // }


  provisioner "file" {
    source      = fileexists("dist/main.js") ? "dist/main.js" : "/"
    destination = "/home/admin/webapp/dist/main.js"
  }

  provisioner "file" {
    source      = "package.json"
    destination = "/home/admin/webapp/package.json"
  }

  provisioner "file" {
    source      = "users.csv"
    destination = "/home/admin/webapp/users.csv"
  }

  provisioner "file" {
    source      = "web-app.service"
    destination = "/home/admin/webapp/web-app.service"
  }

  provisioner "file" {
    source      = "cloudwatch-config.json"
    destination = "/home/admin/webapp/cloudwatch-config.json" # Destination path on the AMI
  }


  provisioner "shell" {
    inline = [
      "cd /home/admin/webapp && npm install",
      "sudo mv /home/admin/webapp/web-app.service /etc/systemd/system/",
      "sudo mv /home/admin/webapp/users.csv /opt/",
      "sudo mv /home/admin/webapp /opt/csye6225/",
      "sudo chown -R csye6225:csye6225 /opt/",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable web-app",
      "sudo systemctl start web-app",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable amazon-cloudwatch-agent",
      "sudo systemctl start amazon-cloudwatch-agent"
    ]
  }

}