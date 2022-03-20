# jema-smartlock
JEM-A Smart Lock

## 概要

電子鍵のJEM-A端子にRaspberry PIを接続し、GPIOで操作するプログラムです。
以下の機能を備えています
* RESTful APIによる操作
* MQTTによる操作
* [Discord](https://discord.com/)への解錠通知
* [Flic](https://flic.io/)による操作

## RESTful API
### ドアの状態を取得します
```http
GET /
```
request
```json
{"state": "LOCK or UNLOCK"}
```
### ドアの状態を設定します
```http
POST /
```
response
```json
{"state": "LOCK or UNLOCK"}
```

## MQTT
### ドアの状態を取得します
```
TOPIC: smartlock/{DOOR_ID}/get
```
message
```
LOCK or UNLOCK
```

### ドアの状態を設定します
```
TOPIC: smartlock/{DOOR_ID}/set
```
message
```
LOCK or UNLOCK
```

## Discord
指定した時間以上施錠されていると、Discordに施錠ボタン付きのメッセージを送信します。

## Flic
シングルタップで解錠、ロングタップで施錠します。
この機能を使うには、[Flic SDK for Linux](https://github.com/50ButtonsEach/fliclib-linux-hci)が必要です。
