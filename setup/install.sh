echo "updating packages"
apt update
apt upgrade -y

echo "installing Node.js and NPM"
apt install -y nodejs npm

echo "installing docker-ce"
apt install apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt install -y docker-ce docker-ce-cli containerd.io

groupadd docker
usermod -aG docker $USER

echo "installing NPM dependencies"
npm install --prefix=../ --production

echo "setup complete. please reboot for permissions to update"
