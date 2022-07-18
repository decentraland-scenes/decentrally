import * as ui from '@dcl/ui-scene-utils'

const uiCanvas = ui.canvas

const leaderboardBackground = new UIContainerRect(uiCanvas);
leaderboardBackground.alignmentUsesSize = true;
leaderboardBackground.positionX = "-38%";
leaderboardBackground.positionY = "5%";
leaderboardBackground.width = 200;
leaderboardBackground.height = 200;
leaderboardBackground.color = Color4.Black();
leaderboardBackground.opacity = 0.5;

uiCanvas.positionX = 0;

let leaderboard: UIText = new UIText(uiCanvas);
leaderboard.positionX = "-38%";
leaderboard.positionY = "5%";
leaderboard.paddingLeft = 10;
leaderboard.fontSize = 15;
leaderboard.width = 200;
leaderboard.height = 210;
leaderboard.hTextAlign = "left";
leaderboard.vAlign = "center";
leaderboard.color = Color4.White();



export function updateLeaderboard(title:string,playerNames: string[]) {
    while (playerNames.length < 10) {
        playerNames.push("");
    }
    playerNames = playerNames.filter((_, i) => i < 10);
    const newVal = title+`:\n\n${playerNames.join("\n")}`
    
    //small performance gain, only set when value changes
    if(leaderboard.value != newVal){
        leaderboard.value = newVal;
    }else{
        //dont update
        //log("updateLeaderboard noop")
    }
}

export function isLeaderboardVisible(){
    return leaderboardBackground.visible
}
export function showLeaderboard(visible:boolean){
    leaderboardBackground.visible = visible
    leaderboard.visible = visible
}