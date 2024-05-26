document.addEventListener('DOMContentLoaded', function() {
    var audio = document.getElementById('backgroundMusic');
    var musicText = document.getElementById('musicText');
    var fadeInDuration = 2000; // 淡入持续时间（毫秒）
    var fadeOutDuration = 2000; // 淡出持续时间（毫秒）
    var maxVolume = 1.0; // 最大音量

    // 渐增音量的函数
    function fadeIn(audio) {
        audio.volume = 0;
        var increment = maxVolume / (fadeInDuration / 100);
        var interval = setInterval(function() {
            if (audio.volume < maxVolume) {
                audio.volume = Math.min(audio.volume + increment, maxVolume);
            } else {
                clearInterval(interval);
            }
        }, 100);
    }

    // 渐减音量的函数
    function fadeOut(audio) {
        var decrement = maxVolume / (fadeOutDuration / 100);
        var interval = setInterval(function() {
            if (audio.volume > 0) {
                audio.volume = Math.max(audio.volume - decrement, 0);
            } else {
                clearInterval(interval);
                audio.pause(); // 当音量为0时暂停音频
            }
        }, 100);
    }

    // 显示音乐文本的函数
    function showMusicText() {
        musicText.classList.remove('hidden');
    }

    // 播放音频并处理淡入
    function playAudio() {
        audio.currentTime = 0; // 重置音频到开头
        audio.play().then(() => {
            fadeIn(audio); // 开始淡入效果
            showMusicText(); // 显示音乐文本
        });
    }

    // 尝试播放音频
    var playPromise = audio.play();

    // 处理播放承诺
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            fadeIn(audio); // 开始淡入效果
            showMusicText(); // 显示音乐文本
        }).catch(error => {
            // 自动播放被阻止
            // 显示一个UI元素，让用户手动开始播放
            document.addEventListener('keydown', function(event) {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'a' || event.key === 'd') {
                    playAudio(); // 当按下箭头键、'a'或'd'时播放音频
                }
            }, { once: true });
        });
    }

    // 添加事件侦听器以在结束前淡出音频
    audio.addEventListener('timeupdate', function() {
        if (audio.duration - audio.currentTime < fadeOutDuration / 1000) {
            fadeOut(audio);
        }
    });

    // 当音频结束时循环播放
    audio.addEventListener('ended', function() {
        playAudio();
    });
});
