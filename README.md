# jema-smartlock
JEM-A Smart Lock

## 概要

電子鍵のJEM-A端子にRaspberry PIを接続し、GPIOで操作するプログラムです。
以下の機能を備えています
* RESTful APIによる操作
* MQTTによる操作
* [Discord](https://discord.com/)への解錠通知
* [Flic](https://flic.io/)による操作

Raspberry PIとJEM-A端子を接続するための回路は、[nana4rider/jem1427-gpio-ts](https://github.com/nana4rider/jem1427-gpio-ts)に記載しています。

## RESTful API
### 電子鍵の状態を取得します
```http
GET /
```
response
```json
{"state": "LOCK or UNLOCK"}
```
### 電子鍵の状態を設定します
```http
PUT /
```
request
```json
{"state": "LOCK or UNLOCK"}
```

## MQTT
### 電子鍵の状態更新通知を受け取ります
```
SUBSCRIBE smartlock/{DOOR_ID}/get
```
message
```
LOCK or UNLOCK
```

### 電子鍵の状態を設定します
```
PUBLISH smartlock/{DOOR_ID}/set
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
