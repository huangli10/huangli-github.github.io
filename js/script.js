// 1. 初始化变量与DOM元素获取
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const currentTime = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const songTitle = document.getElementById('songTitle');
const playlist = document.getElementById('playlist');
const playlistContainer = document.getElementById('playlistContainer');
const listBtn = document.getElementById('listBtn');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
const modeBtn = document.getElementById('modeBtn');
const modeIcon = document.getElementById('modeIcon');
const mvBtn = document.getElementById('mvBtn');
const mvModal = document.getElementById('mvModal');
const mvPlayer = document.getElementById('mvPlayer');
const closeMv = document.querySelector('.close-mv');
const albumCover = document.getElementById('albumCover').querySelector('img');

// 2. 全局状态变量
let isMvLoading = false; // MV加载锁，避免重复请求
let currentSongIndex = 0; // 当前播放歌曲索引
let isMuted = false; // 是否静音
let playMode = 1; // 1:顺序播放 2:单曲循环 3:随机播放

// 3. 歌曲/音频/MV资源配置（路径需与目录结构一致）
const songs = [
    { 
        title: "荷塘月色 - 歌手：凤凰传奇", 
        src: "./mp3/music0.mp3", 
        cover: "./images/record0.jpg",
        mv: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
        bg: "./images/bg0.png"
    },
    { 
        title: "歌曲1 - 歌手B", 
        src: "./mp3/music1.mp3", 
        cover: "./images/record1.jpg",
        mv: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4",
        bg: "./images/bg1.png"
    },
    { 
        title: "歌曲2 - 歌手C", 
        src: "./mp3/music2.mp3", 
        cover: "./images/record2.jpg",
        mv: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4",
        bg: "./images/bg2.png"
    },
    { 
        title: "歌曲3 - 歌手D", 
        src: "./mp3/music3.mp3", 
        cover: "./images/record3.jpg",
        mv: "./mp4/video3.mp4",
        bg: "./images/bg3.png"
    }
];

// 4. 初始化播放列表
function initPlaylist() {
    playlist.innerHTML = ''; // 清空列表
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${song.title}</span>
            <span class="play-icon">${index === currentSongIndex ? "▶" : ""}</span>
        `;
        li.dataset.index = index; // 存储歌曲索引
        li.addEventListener('click', () => playSong(index)); // 点击播放对应歌曲
        playlist.appendChild(li);
    });
}

// 5. 播放指定索引的歌曲
function playSong(index) {
    if (index < 0 || index >= songs.length) return; // 边界判断
    currentSongIndex = index;
    const song = songs[currentSongIndex];
    
    // 更新资源路径
    audioPlayer.src = song.src;
    albumCover.src = song.cover;
    document.body.style.backgroundImage = `url(${song.bg})`;
    songTitle.textContent = song.title;
    
    // 更新播放列表激活状态
    updatePlaylistActive();
    
    // 播放歌曲（处理自动播放限制）
    audioPlayer.play().then(() => {
        playPauseIcon.src = "./images/暂停.png"; // 切换为暂停图标
    }).catch(err => {
        console.error("音频播放失败：", err);
        alert("音频加载失败，请检查文件路径是否正确！");
    });
}

// 6. 更新播放列表激活项（高亮当前播放歌曲）
function updatePlaylistActive() {
    const allItems = playlist.querySelectorAll('li');
    allItems.forEach((item, index) => {
        const icon = item.querySelector('.play-icon');
        if (index === currentSongIndex) {
            item.classList.add('active');
            icon.textContent = "▶";
        } else {
            item.classList.remove('active');
            icon.textContent = "";
        }
    });
}

// 7. 时间格式化（秒 → mm:ss）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 8. 切换播放模式（顺序→单曲→随机）
function switchPlayMode() {
    playMode = playMode % 3 + 1;
    switch(playMode) {
        case 1:
            modeIcon.src = "./images/mode1.png";
            modeIcon.alt = "顺序播放";
            break;
        case 2:
            modeIcon.src = "./images/mode2.png";
            modeIcon.alt = "单曲循环";
            break;
        case 3:
            modeIcon.src = "./images/mode3.png";
            modeIcon.alt = "随机播放";
            break;
    }
}

// 9. 打开MV播放（核心功能，修复加载冲突）
function openMV() {
    // 加载锁：避免短时间内重复点击
    if (isMvLoading) return;
    isMvLoading = true;

    // 校验当前歌曲是否有MV资源
    const currentSong = songs[currentSongIndex];
    if (!currentSong.mv || currentSong.mv.trim() === "") {
        alert("该歌曲暂无MV资源！");
        isMvLoading = false;
        return;
    }

    try {
        // 1. 暂停音频，避免声音冲突
        audioPlayer.pause();
        playPauseIcon.src = "./images/继续播放.png";

        // 2. 重置MV播放器状态（避免加载冲突）
        mvPlayer.pause();
        mvPlayer.src = "";
        mvModal.style.display = 'none';

        // 3. 设置MV资源路径并加载
        mvPlayer.src = currentSong.mv;
        console.log("正在加载MV：", currentSong.mv);

        // 4. 监听视频"可播放"事件（确保加载完成后再显示）
        const handleCanPlay = () => {
            mvModal.style.display = 'flex'; // 显示弹窗
            // 尝试自动播放（处理浏览器限制）
            mvPlayer.play().catch(err => {
                console.warn("MV自动播放被浏览器阻止：", err);
                alert("浏览器限制自动播放，请手动点击视频中的播放按钮～");
            });
            // 移除一次性监听（避免重复触发）
            mvPlayer.removeEventListener('canplay', handleCanPlay);
        };

        // 5. 监听MV加载失败事件
        const handleError = () => {
        
            // 清理状态
            isMvLoading = false;
            mvPlayer.removeEventListener('canplay', handleCanPlay);
            mvPlayer.removeEventListener('error', handleError);
        };

        // 绑定事件监听
        mvPlayer.addEventListener('canplay', handleCanPlay);
        mvPlayer.addEventListener('error', handleError);

        // 显式触发视频加载
        mvPlayer.load();

    } catch (error) {
        console.error("MV初始化异常：", error);
        alert("MV播放初始化失败，请刷新页面重试！");
        isMvLoading = false;
    } finally {
        // 确保2秒后解锁（防止异常导致锁一直生效）
        setTimeout(() => {
            isMvLoading = false;
        }, 2000);
    }
}

// 10. 关闭MV播放（清理状态）
function closeMV() {
    // 1. 隐藏弹窗
    mvModal.style.display = 'none';
    
    // 2. 重置MV播放器（释放资源）
    if (mvPlayer) {
        mvPlayer.pause();
        mvPlayer.src = "";
        mvPlayer.load();
    }

    // 可选：关闭MV后自动恢复音频播放
    // audioPlayer.play();
    // playPauseIcon.src = "./images/暂停.png";
}

// 11. 绑定所有事件监听
function bindEvents() {
    // 播放/暂停按钮
    playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseIcon.src = "./images/暂停.png";
        } else {
            audioPlayer.pause();
            playPauseIcon.src = "./images/继续播放.png";
        }
    });

    // 上一曲按钮
    prevBtn.addEventListener('click', () => {
        if (playMode === 3) {
            // 随机播放（排除当前索引）
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === currentSongIndex && songs.length > 1);
            currentSongIndex = randomIndex;
        } else {
            // 顺序/单曲循环：上一曲
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        playSong(currentSongIndex);
    });

    // 下一曲按钮
    nextBtn.addEventListener('click', () => {
        if (playMode === 3) {
            // 随机播放（排除当前索引）
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
            } while (randomIndex === currentSongIndex && songs.length > 1);
            currentSongIndex = randomIndex;
        } else {
            // 顺序/单曲循环：下一曲
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        playSong(currentSongIndex);
    });

    // 进度条拖动（跳转到指定时间）
    progressBar.addEventListener('input', () => {
        if (isNaN(audioPlayer.duration)) return;
        const targetTime = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = targetTime;
    });

    // 音频播放进度更新
    audioPlayer.addEventListener('timeupdate', () => {
        const current = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        if (!isNaN(duration)) {
            const progress = (current / duration) * 100;
            progressBar.value = progress;
            currentTime.textContent = formatTime(current);
            totalTime.textContent = formatTime(duration);
        }
    });

    // 音频播放结束（自动下一曲）
    audioPlayer.addEventListener('ended', () => {
        if (playMode === 2) {
            // 单曲循环：重新播放当前歌曲
            playSong(currentSongIndex);
        } else {
            // 顺序/随机：下一曲
            nextBtn.click();
        }
    });

    // 音频加载完成后更新总时长
    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTime.textContent = formatTime(audioPlayer.duration);
    });

    // 播放列表显示/隐藏
    listBtn.addEventListener('click', () => {
        playlistContainer.classList.toggle('active');
    });

    // 音量/静音切换
    volumeBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        audioPlayer.muted = isMuted;
        volumeIcon.src = isMuted ? "./images/静音.png" : "./images/音量.png";
    });

    // 播放模式切换
    modeBtn.addEventListener('click', switchPlayMode);

    // MV播放按钮
    mvBtn.addEventListener('click', openMV);

    // 关闭MV弹窗（按钮）
    closeMv.addEventListener('click', closeMV);

    // 点击MV弹窗外部关闭
    mvModal.addEventListener('click', (e) => {
        if (e.target === mvModal) {
            closeMV();
        }
    });

    // MV播放结束后自动关闭弹窗
    mvPlayer.addEventListener('ended', closeMV);
}

// 12. 页面加载完成后初始化（入口函数）
window.addEventListener('load', () => {
    initPlaylist(); // 初始化播放列表
    bindEvents(); // 绑定所有事件

    // 默认加载第一首歌（不自动播放，符合浏览器政策）
    const firstSong = songs[0];
    audioPlayer.src = firstSong.src;
    albumCover.src = firstSong.cover;
    document.body.style.backgroundImage = `url(${firstSong.bg})`;
    songTitle.textContent = firstSong.title;
    updatePlaylistActive();
});