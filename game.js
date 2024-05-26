const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const npc = document.getElementById('npc');
const airplane = document.getElementById('airplane');
const progress = document.getElementById('progress');
const loveCounter = document.getElementById('love-counter');
const cloudContainer = document.getElementById('cloud-container');
const umbrella = document.getElementById('umbrella');
const emoMessage = document.getElementById('emo-message');
const dialogueElement = document.getElementById('dialogue');
const dialogueTextElement = document.getElementById('dialogue-text');
const leaderboard = document.getElementById('leaderboard'); // 新增获取#leaderboard元素

let loveValue;
let progressValue;
let gameDuration = 50000; // 游戏时长50秒（以毫秒为单位）
let gameOver;
let npcMoveInterval;
let npcMoveSpeed = 2000; // NPC 移动间隔
let sosoDialogueTimeouts = [];

let npcEmoState = false; // 初始化 emo 状态
let emoEndTime = 20; // emo 状态持续时间
let emoTimerInterval; // emo 状态计时器
let prevNpcEmoState = false; // 上一次的 npc emo 状态
let lastEmoEndTime = 0; // 记录最后一次 emo 状态结束的时间


let playerX;
let npcX;
let emoCount = 0; // 记录 NPC 进入 emo 状态的次数
const maxEmoCount = 3; // 最大的 emo 状态次数
airplane.style.transformOrigin = `50% calc(100% + 50px)`;

// 更新爱心值显示
function updateLoveCounter() {
    loveCounter.textContent = `❤: ${loveValue}`;
}

// 生成爱心
function createHeart() {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.style.left = `${Math.random() * 100}%`;
    cloudContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 10000);

    // 爱心移动和碰撞检测
    let heartInterval = setInterval(() => {
        let heartRect = heart.getBoundingClientRect();
        let playerRect = player.getBoundingClientRect();

        // 检查爱心是否碰到玩家
        if (
            heartRect.top < playerRect.bottom &&
            heartRect.bottom > playerRect.top &&
            heartRect.left < playerRect.right &&
            heartRect.right > playerRect.left
        ) {
            // 碰到玩家，增加爱心值
            loveValue++;
            updateLoveCounter();
            heart.remove();
            clearInterval(heartInterval);
        }
    }, 100);
}

// 生成云朵
function createCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.style.left = `${Math.random() * 100}%`;
    cloudContainer.appendChild(cloud);
    setTimeout(() => cloud.remove(), 10000);

    // 云朵移动和碰撞检测
    let cloudInterval = setInterval(() => {
        let cloudRect = cloud.getBoundingClientRect();
        let playerRect = player.getBoundingClientRect();

        // 检查云朵是否碰到玩家
        if (
            cloudRect.top < playerRect.bottom &&
            cloudRect.bottom > playerRect.top &&
            cloudRect.left < playerRect.right &&
            cloudRect.right > playerRect.left
        ) {
            // 碰到玩家，减少爱心值
            loveValue--;
            updateLoveCounter();

            if (loveValue <= 0) {
                gameOver = true;
                airplane.classList.add('crash');
                if (confirm('赛博爱心耗尽，少侠是否从头来过?')) {
                    resetGame(); // 如果用户点击确定，则重置游戏
                }
                clearInterval(cloudInterval);
                return;
            }

            cloud.remove();
            clearInterval(cloudInterval);
        }
    }, 100);
}

let emoFrameCounter = 0; // emo状态下的帧计数器

// NPC 随机移动
function moveNpc() {
    const currentTime = Date.now();

    if (!npcEmoState && Math.random() < 0.1 && currentTime > lastEmoEndTime + 10000) {
        npcEmoState = true;
        npcEmoEndTime = currentTime + 20000;

        emoMessage.style.display = 'block';
        updateEmoMessage(emoEndTime, npcEmoState, false); // 使用 false 表示之前不是 emo 状态

        emoTimerInterval = setInterval(() => {
            emoEndTime--;
            updateEmoMessage(emoEndTime, npcEmoState, true); // 使用 true 表示之前是 emo 状态
            if (emoEndTime <= 0) {
                clearInterval(emoTimerInterval);
                npcEmoState = false;
                lastEmoEndTime = Date.now(); // 记录当前时间为最后一次 emo 状态结束的时间
                updateEmoMessage(0, npcEmoState, true, true); // 更新消息，表示脱离 emo，且为主动脱离
            }
        }, 1000);

        emoFrameCounter = 0; // 重置 emo 帧计数器
        emoCount++; // 记录 NPC 进入 emo 状态的次数
    }

    if (npcEmoState) {
        emoFrameCounter++;
        // 每 20 帧生成一个乌云
        if (emoFrameCounter % 20 === 0) {
            createCloud();
        }
    }

    let npcSpeed = Math.random() * 20 - 10;
    npcX += npcSpeed;

    let minX = 150;
    let maxX = 650;

    if (npcX < minX) npcX = minX;
    if (npcX > maxX) npcX = maxX;

    npc.style.left = `${npcX}px`;

    if (npcEmoState) {
        let npcRect = npc.getBoundingClientRect();
        let playerRect = player.getBoundingClientRect();

        if (
            npcRect.top < playerRect.bottom &&
            npcRect.bottom > playerRect.top &&
            npcRect.left < playerRect.right &&
            npcRect.right > playerRect.left
        ) {
            npcEmoState = false;
            clearInterval(emoTimerInterval);
            lastEmoEndTime = Date.now(); // 记录当前时间为最后一次 emo 状态结束的时间
            createHeartEffect();
            loveValue++;
            updateLoveCounter();

            // 更新消息，表示脱离 emo，且为被动脱离
            updateEmoMessage(0, npcEmoState, true, false); 
        }
    }

    prevNpcEmoState = npcEmoState;
}

function updateEmoMessage(secondsLeft, emoState, prevEmoState, proactive = false) {
    if (emoState && !prevEmoState) {
        emoMessage.textContent = `Soso 进入emo状态! 请贴贴治愈她。emo剩余时间: ${secondsLeft}s`;
    } else if (!emoState && prevEmoState) {
        if (proactive) {
            emoMessage.textContent = `虽然没有贴贴 soso 也顽强自愈了`;
        } else {
            emoMessage.textContent = `在popo的贴贴下soso脱离了emo状态`;
        }
    } else if (emoState) {
        emoMessage.textContent = `Soso 进入emo状态! 请贴贴治愈她。emo剩余时间: ${secondsLeft}s`;
    }
}


// 创建爱心特效函数
function createHeartEffect() {
    const heartEffect = document.createElement('div');
    heartEffect.className = 'heart-effect';
    heartEffect.style.left = `${npcX}px`; // 定位到NPC的位置
    heartEffect.style.top = `${npc.getBoundingClientRect().top}px`; // 定位到NPC顶部
    cloudContainer.appendChild(heartEffect);

    // 设置特效3秒后移除
    setTimeout(() => heartEffect.remove(), 3000);
}


// 玩家控制
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'a') { // 当按下 "ArrowLeft" 键或 "a" 键时，向左移动
        playerX -= 5;
    } else if (event.key === 'ArrowRight' || event.key === 'd') { // 当按下 "ArrowRight" 键或 "d" 键时，向右移动
        playerX += 5;
    }

    // 限制玩家的移动范围在飞机上
    if (playerX < 150) playerX = 150;
    if (playerX > 650) playerX = 650;

    player.style.left = `${playerX}px`;
});


// 更新纸飞机的倾斜
function updateAirplaneTilt() {
    let tilt = (npcX + playerX - 800) / 10; // 根据NPC和玩家的位置计算倾斜角度

    airplane.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
    npc.style.transform = `translateX(-50%) rotate(${tilt}deg)`;
    player.style.transform = `translateX(-50%) rotate(${tilt}deg)`;

    // 更新 CSS 变量来表示实时的倾斜角度
    document.documentElement.style.setProperty('--tilt-angle', `${tilt}deg`);

    // 检查倾斜是否过大
    if (Math.abs(tilt) > 15) {
        gameOver = true;
        // 添加动画类名以触发旋转
        npc.classList.add('crash');
        player.classList.add('crash');
        airplane.classList.add('crash');

        // 根据倾斜的方向设置旋转方向
        if (tilt > 0) {
            document.documentElement.style.setProperty('--rotation-direction', '1');
        } else {
            document.documentElement.style.setProperty('--rotation-direction', '-1');
        }

        // 修改图片
        npc.style.backgroundImage = "url('images/npc2.png')";
        player.style.backgroundImage = "url('images/player2.png')";

        // 设置透明度渐变动画
        npc.style.transition = 'opacity 2s';
        player.style.transition = 'opacity 2s';
        npc.style.opacity = 0.2;
        player.style.opacity = 0.2;
        airplane.style.transition = 'opacity 2s';
        airplane.style.opacity = 0;

        document.dispatchEvent(new Event('crash')); // 触发crash事件
        setTimeout(() => {
            if (confirm('纸飞机失去平衡，少侠请重新来过!')) {
                resetGame();
            }
        }, 1000);
    }
}

// 游戏主循环
let frameCounter = 0; // 帧计数器

function gameLoop() {
    if (gameOver) return;

    frameCounter++;

    moveNpc();
    updateAirplaneTilt();

    // 每20帧生成一个爱心
    if (frameCounter % 10 === 0) {
        createHeart();
    }

    // 更新进度条
    progressValue += 1000 / 60;
    progress.style.width = `${progressValue / gameDuration * 100}%`;

    if (progressValue >= gameDuration) {
        saveGameResult(loveValue); // 调用保存游戏结果函数
        if (confirm('游戏胜利，宝贝一周年快乐!')) {
            resetGame();
            updateLeaderboard(); // 更新并显示排行榜
        }
        saveGameResult(loveValue);
        return;
    }

    requestAnimationFrame(gameLoop);
}

// 保存游戏结果
function saveGameResult(loveValue) {
    const result = {
        loveValue: loveValue, // Update the loveValue property with the value obtained at the end of the game
        date: new Date().toLocaleString()
    };

    const results = JSON.parse(localStorage.getItem('gameResults')) || [];
    results.push(result);
    localStorage.setItem('gameResults', JSON.stringify(results));
    updateLeaderboard();
}

// 更新排行榜
function updateLeaderboard() {
    const results = JSON.parse(localStorage.getItem('gameResults')) || [];
    // 先按爱心值降序排序
    results.sort((a, b) => b.loveValue - a.loveValue);
    leaderboard.innerHTML = '';

    // 只添加前5名到排行榜
    results.slice(0, 5).forEach((result, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `纪录${index + 1}: 爱心值 ${result.loveValue} ——时间 ${result.date}`;
        leaderboard.appendChild(listItem);
    });
}

// 显示soso对话


function sosoDialogue() {
    const dialogues = [
        "Dear PoPo, hope this letter find you well",
        "这么快就一周年了爱我的宝贝就像呼吸一样自然而然",
        "宝宝贴贴大贴贴",
        "我emo的时候谢谢宝贝的包容蹭蹭宝贝的生机勃勃",
        "我也在变得更坦诚希望给我的宝贝带来更多的快乐",
        "王鹏是行走的我推",
        "我们一起做天荒地老的快乐阿宅",
        "我真的不会写代码呜呜在阳着虚弱的情况下还能做出来别厉害死我了谢谢gpt4o帮忙",
        "宝宝饿饿宝宝贴贴宝宝爱你",
       
    ];

    let index = 0;

    function displayDialogue() {
        if (index < dialogues.length) {
            const dialogueText = dialogues[index];
            let currentIndex = 0;


            dialogueTextElement.innerHTML = ''; // 清空之前的对话内容
            dialogueElement.style.display = 'flex'; // 显示对话框（使用 flex 以便显示头像和文字）

            // 清除之前的 setTimeout 和 setInterval 函数
            for (let i = 0; i < sosoDialogueTimeouts.length; i++) {
                clearTimeout(sosoDialogueTimeouts[i]);
                clearInterval(sosoDialogueTimeouts[i]);
            }
            sosoDialogueTimeouts = [];

            let interval = setInterval(function () {
                dialogueTextElement.innerHTML += dialogueText[currentIndex];
                currentIndex++;
                if (currentIndex === dialogueText.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        dialogueElement.style.display = 'none';
                        index++;
                        displayDialogue(); // 递归调用显示下一条台词
                    }, 3000);
                }
            }, 100);
            // 存储 interval ID
            sosoDialogueTimeouts.push(interval);
        }
    }

    displayDialogue();
}

// 初始化
function resetGame() {
    // 清除所有现有的对话定时器
    sosoDialogueTimeouts.forEach(timeout => {
        clearTimeout(timeout);
        clearInterval(timeout);
    });
    sosoDialogueTimeouts = [];
    loveValue = 100;
    progressValue = 0;
    npcEmoState = false;
    emoEndTime = 20;
    gameOver = false;
    lastEmoEndTime = 0; // 重置最后一次 emo 状态结束的时间

    // 重置飞机的位置和倾斜角度
    airplane.style.transform = 'translateX(-50%) rotate(0deg)';
    airplane.classList.remove('crash');
    airplane.style.opacity = 1;

    // 重置玩家和NPC的状态
    player.style.transform = 'translateX(-50%) rotate(0deg)';
    npc.style.transform = ' translateX(-50%) rotate(0deg)';
    player.classList.remove('crash');
    npc.classList.remove('crash');
    player.style.backgroundImage = "url('images/player.png')";
    npc.style.backgroundImage = "url('images/npc.png')";
    player.style.opacity = 1;
    npc.style.opacity = 1;

    playerX = 400;
    npcX = 420;
    player.style.left = `${playerX}px`;
    npc.style.left = `${npcX}px`;

    emoMessage.style.display = 'none';
    cloudContainer.innerHTML = '';

    updateLoveCounter();
    progress.style.width = '0%';

    frameCounter = 0; // 重置帧计数器
    emoFrameCounter = 0; // 重置emo帧计数器
    emoCount = 0; // 重置 emoCount
    prevNpcEmoState = false; // 初始化 prevNpcEmoState

    if (npcMoveInterval) clearInterval(npcMoveInterval);
    npcMoveInterval = setInterval(moveNpc, npcMoveSpeed);

    sosoDialogue(); // 调用sosoDialogue显示对话
    gameLoop();
    updateLeaderboard();
}

resetGame();
