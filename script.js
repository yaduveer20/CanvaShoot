'use strict';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const elemScore = document.querySelector('#score');
const btnStart = document.querySelector('#start');
const conModal = document.querySelector('#modal');
const elemModalScore = document.querySelector('#modal-score');

//projectile velocity
const projectileVelocity = 10;
const enemyMinVelocity = 1;
const enemyMaxVelocity = 2;
const minEnemyRadius = 5;
const maxEnemyRadius = 50;

//event listener for resize event
window.addEventListener('resize',()=>{
    init();
});


//prototype of player object
class Player{
    constructor(x,y,r,color){
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = color;
        // console.log('xx', this.x,this.y,this.r);
    }

    draw(){
        ctx.beginPath();
        if(this.r > 0) ctx.arc(this.x,this.y,this.r,0,Math.PI*2,false);
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
    }

    updatePlayer(){
        this.draw();
    }
}

//prototype of shooting projectile
class Projectile extends Player{
    constructor(x,y,r,color,velocity){
        super(x,y,r,color);
        this.velocity = velocity;
    }

    updateProjectile(){
        // console.log(projectiles);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

//prototype of enemy objects
class Enemy extends Player{
    constructor(x,y,r,color,velocity){
        super(x,y,r,color);
        this.velocity = velocity;
    }

    updateEnemy(){
        this.x += this.velocity.x*randomInRange(enemyMinVelocity,enemyMaxVelocity);
        this.y += this.velocity.y*randomInRange(enemyMinVelocity,enemyMaxVelocity);
        this.draw();
    }
}

//prototype of explosion particles
const friction = 0.98;
class Particle extends Player{
    constructor(x,y,r,color,velocity){
        super(x,y,r,color);
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw(){
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.r,0,Math.PI*2,false);
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    update(){
        this.alpha -= 0.01;
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.draw();
    }
}

//game variables
let player;
let projectiles;
let enemies;
let particles;
let hasStarted;
let score;

//event listener for mouse click events to shoot projectile towards the clicked point
window.addEventListener('click',event=>{
    if(!hasStarted) return;

    const angle = Math.atan2(event.clientY-canvas.height/2, event.clientX-canvas.width/2);
    const velocity = {
        x: Math.cos(angle)*projectileVelocity,
        y: Math.sin(angle)*projectileVelocity
    };

    projectiles.push(new Projectile(canvas.width/2,canvas.height/2,10,'red',velocity));
});

//function to generate random enemies after a certain time interval
function generateEnemies(){
    setInterval(()=>{
        let x;
        let y;
        const r = randomInRange(minEnemyRadius,maxEnemyRadius);
        if(Math.random() < 0.5){
            x = Math.random() <0.5 ? -r : canvas.width+r;
            y = randomInRange(-r,canvas.height+r);
        }
        else{
            x = randomInRange(-r,canvas.width+r);
            y = Math.random()<0.5 ? -r : canvas.height+r;
        }
        const angle = Math.atan2(canvas.height/2-y, canvas.width/2-x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        const color = `hsl(${Math.random()*361},50%,50%)`;
        enemies.push(new Enemy(x,y,r,color,velocity));
        if(enemies.length > 0) hasStarted = true;
    }, 2000);
}


//function to generate random numbers in a range 
function randomInRange(min,max){
    return Math.random()*(max-min+1)+min;
}

//calculate hypoteneus distance between the centres of two circles
function hypotDistance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}


//initialize the game
function init(){
    canvas.height= innerHeight;
    canvas.width= innerWidth;

    player = new Player(canvas.width/2,canvas.height/2,10,'white');
    projectiles = [];
    enemies = [];
    particles = [];
    canvas.style.backgroundColor = 'black';
    score = 0;
    hasStarted = false;
    elemScore.textContent = score;
    elemModalScore.textContent = score;
}

//animate the game by constantly refreshing the animation frames
let animationID;
function animate(){
    
    animationID = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    player.updatePlayer();

    //update projectiles
    projectiles.forEach((projectile,pindex)=>{

        //projectile vanishes when it hits the any boundry of the canvas
        if(projectile.x <= -projectile.r || projectile.x > canvas.width+projectile.r 
            || projectile.y <= -projectile.r || projectile.y >canvas.height + projectile.r){
                // console.log('inn');
            projectiles.splice(pindex,1);
        }
        projectile.updateProjectile();
    });

    //update particles
    particles.forEach((particle,index)=>{
        particle.update();
        if(particle.alpha <= 0) particles.splice(index,1);
    });

    //update enemies
    let distance;
    enemies.forEach((enemy,eindex)=>{

        //enemy collides with the player - game ends
        distance = hypotDistance(enemy.x,enemy.y,player.x,player.y);
        if(distance-(enemy.r+player.r) <= 0){

            cancelAnimationFrame(animationID);
            elemModalScore.textContent = score;
            conModal.style.display = 'flex';
        } 
        
        projectiles.forEach((projectile,pindex)=>{
            // console.log('inside');
            distance = hypotDistance(enemy.x, enemy.y, projectile.x, projectile.y);
            // console.log(dist,enemy.x,enemy.y,projectile.x,projectile.y);
            
            //projectile vanishes and enemy reduces/vanies on collision
            if(distance - (enemy.r+projectile.r)<=0){

                //create particles on explosion
                for(let i = 0; i<enemy.r*2; i++){
                    // console.log(i);
                    particles.push(new Particle(
                        projectile.x,projectile.y,Math.random()*randomInRange(0.5,2),
                        enemy.color,
                        {
                            x: (Math.random()-0.5)*(Math.random()*10),
                            y: (Math.random()-0.5)*(Math.random()*10)
                        }
                    ));
                }

                if(enemy.r-10 > 10){
                    score += 100;
                    gsap.to(enemy,{
                        r: enemy.r-10
                    });
                }
                else{
                    score += 150;
                    enemies.splice(eindex,1);
                }
                elemScore.textContent = score;
                projectiles.splice(pindex,1);
            }
        });

        enemy.updateEnemy();
    });
}

//initialize the states
init();

//event listener for start button to start the game
btnStart.addEventListener('click',()=>{
    conModal.style.display = 'none';
    init();
    animate();
    generateEnemies();
});


