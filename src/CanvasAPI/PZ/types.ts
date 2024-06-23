export type Me = {
    name: string,
    id: string,
    createdAt: string
    email: string,
    avatar: string,
    lastLogin: string,
    roles: Array<string>,
    pixels: number
}

export type ZoneInfo = {
	colors: Array<string>,
	id: string,
	name: string,
	pixelCapacity: number,
	pixelCooldown: number,
	size: number
}