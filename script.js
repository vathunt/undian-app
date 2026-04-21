let remainingParticipants = [];
let roundNumber = 0;

function draw() {
    const textarea = document.getElementById('participants');
    const input = textarea.value.trim();
    const winnerCount = parseInt(document.getElementById('winnerCount').value);
    const removeWinners = document.getElementById('removeWinners').checked;
    const resultDiv = document.getElementById('result');
    const clapSound = document.getElementById('clapSound');
    const fireworksCanvas = document.getElementById('fireworksCanvas');
    const drawButton = document.getElementById('btnUndi');
    const overlay = document.getElementById('loadingOverlay');

    const file = "cheering-applause.mp3";

    // hanya berubah setiap hari (YYYY-MM-DD)
    const version = new Date().toISOString().split("T")[0];
    clapSound.src = file + "?v=" + version;

    if (remainingParticipants.length === 0) {
        remainingParticipants = input.split('\n').map(p => p.trim()).filter(p => p);
    }

    if (remainingParticipants.length === 0) {
        alert('Daftar peserta kosong!');
        return;
    }

    if (winnerCount < 1) {
        alert('Jumlah pemenang tidak boleh kosong');
        return;
    }

    if (winnerCount > remainingParticipants.length && removeWinners) {
        alert('Jumlah pemenang melebihi jumlah peserta yang tersisa!');
        return;
    }

    // Tampilkan overlay
    overlay.classList.remove('hide');
    overlay.classList.add('show');
    const textOVerlay = overlay.querySelector('p');
    textOVerlay.textContent = `Sedang mencari ${winnerCount} orang yang beruntung...`;
    drawButton.disabled = true;

    setTimeout(() => {
        const winners = [];
        const usedIndexes = new Set();

        while (winners.length < winnerCount) {
            const randIndex = Math.floor(Math.random() * remainingParticipants.length);
            if (!removeWinners && usedIndexes.has(randIndex)) continue;

            winners.push(remainingParticipants[randIndex]);
            usedIndexes.add(randIndex);

            if (removeWinners) {
                remainingParticipants.splice(randIndex, 1);
            }
        }

        if (removeWinners) {
            textarea.value = remainingParticipants.join('\n');
        }

        roundNumber++;

        // === Tambahkan popup modal di sini ===
        const modal = document.createElement('div');
        modal.classList.add('winner-modal');
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-box">
                <h2>🎉 Pemenang Putaran ${roundNumber}</h2>
                <p>${winners.join('<br>')}</p>
                <button id="closeModal">Tutup</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Setelah selesai
        overlay.classList.remove('show');
        overlay.classList.add('hide');

        // mainkan suara
        clapSound.currentTime = 0;
        clapSound.play().catch(e => console.log("Audio gagal diputar:", e));

        // Event untuk menutup modal
        modal.querySelector('#closeModal').addEventListener('click', () => {
            modal.remove();
            drawButton.disabled = false;

            resultDiv.classList.add('show');
            const winnerHtml = winners.map((w, k) => `<div class="winner">${k + 1}. ${w}</div>`).join('');
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `
                <h4>🎯 Pemenang Putaran ${roundNumber} (${winnerCount} peserta)</h4>
                    ${winnerHtml}
                <hr>
            `;
            resultDiv.prepend(wrapper);
            resultDiv.scrollTop = 0;
        });
    }, 3000); // timeout singkat agar spinner terlihat


    // Fireworks
    showFireworks(fireworksCanvas);
}

// Fireworks animation
function showFireworks(canvas) {
    const ctx = canvas.getContext('2d');
    resizeCanvas();

    const fireworks = [];
    const particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    class Firework {
        constructor() {
            this.x = random(0, canvas.width);
            this.y = canvas.height;
            this.targetY = random(canvas.height * 0.2, canvas.height * 0.5);
            this.speed = random(3, 5);
            this.exploded = false;
        }
        update() {
            if (!this.exploded) {
                this.y -= this.speed;
                if (this.y <= this.targetY) {
                    this.exploded = true;
                    this.explode();
                }
            }
        }
        explode() {
            const count = 30;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(this.x, this.targetY));
            }
        }
    }

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.speed = random(1, 6);
            this.angle = random(0, Math.PI * 2);
            this.friction = 0.98;
            this.gravity = 0.1;
            this.alpha = 1;
            this.decay = random(0.015, 0.03);
            this.color = `hsl(${random(0, 360)}, 100%, 50%)`;
        }
        update() {
            this.speed *= this.friction;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed + this.gravity;
            this.alpha -= this.decay;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // membuat beberapa firework
    for (let i = 0; i < 3; i++) {
        fireworks.push(new Firework());
    }

    function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let fw of fireworks) {
            fw.update();
        }

        fireworks.forEach((fw, i) => {
            if (fw.exploded) {
                fireworks.splice(i, 1);
                fireworks.push(new Firework());
            }
        });

        for (let p = particles.length - 1; p >= 0; p--) {
            const pt = particles[p];
            pt.update();
            if (pt.alpha <= 0) {
                particles.splice(p, 1);
            } else {
                pt.draw();
            }
        }

        if (fireworks.length === 0 && particles.length === 0) {
            // selesai => hentikan animasi setelah beberapa detik
            return;
        }

        requestAnimationFrame(animate);
    }

    animate();
}