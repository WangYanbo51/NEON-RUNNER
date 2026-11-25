// 全局玩法参数
export const LANES = [-2.25, 0, 2.25]; // 三条轨道的 x 坐标
export const PLAYER_Z = 0; // 玩家永远固定在 z=0，靠障碍物向 +Z 移动来制造前进感
export const SPAWN_Z = -178; // 障碍物生成位置
export const DESPAWN_Z = 18; // 越过相机后回收

export const SPEED_START = 17;
export const SPEED_MAX = 47;
export const SPEED_ACCEL = 0.42; // 每秒加速度

export const GRAVITY = 34;
export const JUMP_VELOCITY = 12.4; // 跳跃高度约 2.26，滞空约 0.73s
export const FAST_FALL = -22;
export const SLIDE_DURATION = 0.62;

export const STAND_H = 1.85;
export const SLIDE_H = 0.8;
export const PLAYER_HW = 0.42; // 半宽
export const PLAYER_HD = 0.45; // 半深

export const GROUND_Y = 0;
