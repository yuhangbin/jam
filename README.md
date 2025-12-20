# jam

A music jam playground.

## MVP
### User Story
采用音乐即兴中[call and response模式](https://en.wikipedia.org/wiki/Call_and_response_(music))作为设计原型。基于伴奏，用户进行即兴，
而AI做出回应。

三个音轨
1. backtrack （伴奏音轨）
2. ai track （AI生产音轨）
3. user track （用户即兴音轨）

### How to play it
1. upload backtrack music file and loop it
2. play something and wait ai response
3. listen ai response then play again

### Core Design
第一个版本采用[midi协议](https://en.wikipedia.org/wiki/MIDI)作为用户和AI音乐交流协议。 为什么采用midi协议？主要是因为即兴对音频的实时性要求较高，采用midi协议文件远小于直接的音频协议，
在无端到端AI的模型下是暂时能想到最优的选择。

#### Call Part
user audio input  -> user midi data 
#### Response Part
user midi data & prompt -> ai -> response midi  

#### AI
用户可以自己自定义AI来满足自己想要的即兴音乐家（音乐类型，个人风格等属性）


## Inspired by
- [BB King & John Mayer Live | Improv Jam | Part 1](https://www.youtube.com/watch?v=f6dnI1WsFrA)
- [Jacob Collier x Google MusicFX DJ
](https://www.youtube.com/watch?v=IUQW5LgBZvQ&t=6019s)