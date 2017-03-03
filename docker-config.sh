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
# This script helped by steem-docker run.sh script by
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
if ! openssl_loc="$(type -p "$openssl")" || [ -z "$openssl_loc" ]; then
  canGenRnd = "n"
else
  canGenRnd = "y"
  echo "OpenSSL found on your system. To auto generate keys,"
  echo "press enter without input where indicated."
fi
echo

# COOKIE_SECRET
echo "Cookie secret (any random string)"
while true; do
  echo "[Type and press enter]: "
  read cookiesecret

  if [[ $cookiesecret == "" ]]
  then
    if [[ $cangenrnd == "y" ]]
    then
        cookiesecret = $(openssl rand -base64 32)
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
  echo "[Type and press enter]: "
  read botapikey

  if [[ $botapikey == "" ]]
  then
    if [[ $cangenrnd == "y" ]]
    then
        botapikey = $(openssl rand -base64 32)
        echo "** IMPORTANT ** Note this key down. You can find it in /steem-fossbot-voter/Dockerfile if you lose it"
        echo botapikey
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
  echo "[Type and press enter]: "
  read steemusername

  if [[ $steemusername == "" ]]
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
  echo "[Type and press enter]: "
  read prvpostkey

  if [[ $prvpostkey == "" ]]
  then
    echo "You must enter a valid private posting key"
    echo
  else
    break
  fi
done

# TODO : get run frequency

# Test values
echo "Test values"
printf "ENV COOKIE_SECRET \"%s\"" "$cookiesecret"
printf "ENV BOT_API_KEY \"%s\"" "botapikey"
printf "ENV STEEM_USER \"%s\"" "steemusername"
printf "ENV POSTING_KEY_PRV \"%s\"" "prvpostkey"

# TODO : copy files and append these variables