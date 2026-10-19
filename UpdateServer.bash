docker compose down
sudo rm -f -r nginx
sudo git clone https://github.com/alejandroc5604-cyber/nginx
echo "copying kenya.pmtiles"
sudo cp temp_maps/kenya.pmtiles nginx/html/pmtiles_map
docker compose up -d --build