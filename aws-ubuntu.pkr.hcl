
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

variable "profile {
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




  provisioner "shell" {
    inline = [
      "sudo apt update",
      "sudo apt install -y mariadb-server",
      "sudo systemctl start mariadb",
      "sudo systemctl enable mariadb",
      "sudo mysql -u root <<EOF",
      "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Anwesh@root1';",
      "FLUSH PRIVILEGES;",
      "EOF",
      "sudo apt update",
      "sudo apt install -y nodejs npm",
      "node -v",
      "npm -v",
      "mkdir -p ~/webapp/dist"
    ]
  }



  provisioner "file" {
    source      = fileexists(".env") ? ".env" : "/"
    destination = "/home/admin/webapp/.env"
  }

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

  provisioner "shell" {

    inline = [
      "sudo mv ~/webapp/users.csv /opt/",
      "cd ~/webapp && npm install"
    ]
  }

}
