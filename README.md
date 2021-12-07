# openseabot
Automated Opensea notifications to Discord

# Quick start

The environment variable values are just examples.
```shell
git clone https://github.com/Mtihc/openseabot.git

docker build -t openseabot ./openseabot

docker create --name openseabot-process-asset-events \
       --env OPENSEA_API_KEY=a1bcdef23a45678f90abcd123ef4567 \
       --env OPENSEA_COLLECTION_SLUG=doodles-official \
       --env DISCORD_BOT_TOKEN=OAB12CD34EFgHijkLmn5PQp.AbcDef.ghijK6lm7N8oPQrst_Uv9W0xyzA \
       --env DISCORD_CHANNEL_ID=123456789012345678 \
       --env DATA_FILE_PATH=data/data.json \
       --mount type=volume,target=/usr/src/app/data \
       openseabot:latest \
       yarn run process-asset-events
       
docker start openseabot-process-asset-events --attach
```

Run it in a cron job, like at every hour:

```shell
sudo touch /var/log/openseabot-process-asset-events.log
sudo crontab -e

0 * * * * docker start openseabot-process-asset-events >>/var/log/openseabot-process-asset-events.log 2>&1
```
