#!/bin/bash
#
# steem-fossbot-voter Docker config tool
#
# A docker deployment management script for SteemFOSSbot Voter,
# based completely on @shaunmza 's tutorial post:
#     https://steemit.com/bots/@shaunmza/dockerizing-the-steem-fossbot
#
# Script and support written by thrize AKA @personz
#
# This script structure copied from steem-docker run.sh script by
# @someguy123, available at https://github.com/Someguy123/steem-docker
#

echo "***********************"
echo "* steem-fossbot-voter *"
echo "*   docker config     *"
echo "***********************"
echo
echo "You will need to enter several bits of information"
echo "to configure the bot to run in Docker"
echo
echo "** WARNING ** DO NOT COMMIT THESE FILES TO A PUBLIC REPO"
echo

# Check if openssl exists for auto password generation
cangenrnd="n"
if ! openssl_loc="$(type -p "openssl")" || [ -z "$openssl_loc" ]; then
  cangenrnd="n"
else
  cangenrnd="y"
  echo "OpenSSL found on your system. To auto generate keys,"
  echo "press enter without input where indicated."
fi
echo

# COOKIE_SECRET
echo "Cookie secret (any random string)"
while true; do
  echo -n "[Type and press enter]: "
  read cookiesecret

  if [[ -z "$cookiesecret" ]]
  then
    if [[ $cangenrnd == "y" ]]
    then
        cookiesecret=$(openssl rand -base64 32)
        echo $cookiesecret
        break
    else
        echo "You must enter a valid cookie secret"
        echo
    fi
  else
    break
  fi
done
echo

# BOT_API_KEY
echo "Bot API key. This can be anything but you will need it to 'log in' to your bot dashboard"
while true; do
  echo -n "[Type and press enter]: "
  read botapikey

  if [[ -z "$botapikey" ]]
  then
    if [[ $cangenrnd == "y" ]]
    then
        botapikey=$(openssl rand -base64 32)
        echo "** IMPORTANT ** Note this key down. You can find it in /steem-fossbot-voter/Dockerfile if you lose it"
        echo $botapikey
        break
    else
        echo "You must enter a valid bot API key"
        echo
    fi
  else
    break
  fi
done
echo

# STEEM_USER
echo "Steem user name"
while true; do
  echo -n "[Type and press enter]: "
  read steemusername

  if [[ -z "$steemusername" ]]
  then
    echo "You must enter a valid username"
    echo
  else
    break
  fi
done
echo

# POSTING_KEY_PRV
echo "Private posting key. This can be found on your Steemit.com wallet dashboard"
while true; do
  echo -n "[Type and press enter]: "
  read prvpostkey

  if [[ -z "$prvpostkey" ]]
  then
    echo "You must enter a valid private posting key"
    echo
  else
    break
  fi
done

# rate to run script
echo "Frequency to run bot. Choose from one of these presets"
while true; do
  echo "1 - every day"
  echo "2 - every hour"
  echo "3 - every half hour"
  echo "4 - every 10 minutes"
  echo "5 - every 5 minutes"
  echo
  echo -n "[Type number and press enter]: "
  read freqchoice

  if [[ -z "$freqchoice" ]]
  then
    echo "You must enter a valid number between 1 and 5 inclusive"
    echo
  else
    if [[ $freqchoice == "1" ]]
    then
        freqamt="0 0 * * *"
        break
    fi
    if [[ $freqchoice == "2" ]]
    then
        freqamt="0 * * * *"
        break
    fi
    if [[ $freqchoice == "3" ]]
    then
        freqamt="*/30 * * * *"
        break
    fi
    if [[ $freqchoice == "4" ]]
    then
        freqamt="*/10 * * * *"
        break
    fi
    if [[ $freqchoice == "5" ]]
    then
        freqamt="*/5 * * * *"
        break
    fi
  fi
done

# Test values
#echo "Test values"
#printf "ENV COOKIE_SECRET \"%s\"\n" "$cookiesecret"
#printf "ENV BOT_API_KEY \"%s\"\n" "$botapikey"
#printf "ENV STEEM_USER \"%s\"\n" "$steemusername"
#printf "ENV POSTING_KEY_PRV \"%s\"\n" "$prvpostkey"
#echo
#printf "cron period: \"%s\"\n" "$freqamt"

# Create Dockerfile file
cp Dockerfile.default Dockerfile
echo -e "ENV COOKIE_SECRET \"$cookiesecret\"" >> Dockerfile
echo -e "ENV BOT_API_KEY \n\"$botapikey\"" >> Dockerfile
echo -e "ENV STEEM_USER \n\"$steemusername\"" >> Dockerfile
echo -e "ENV POSTING_KEY_PRV \n\"$prvpostkey\"" >> Dockerfile

# Create crontab file
> crontab
echo "$freqamt root node /src/bot.js >> /var/log/cron.log 2>&1" >> crontab

# Create bot.sh
cp bot.sh.default bot.sh

#Finish
echo
echo "docker-config is complete"
echo "*************************"