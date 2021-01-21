import { makeObservable, observable, action } from 'mobx';
import axios from 'axios';
import io from "socket.io-client";
import {
    ASK_FOR_VIDEO_INFORMATION, JOIN_ROOM, ADD_PLAYER, PLAYER_MOVED
} from '../Constants';

const socketUrl = "http://localhost:4200";

export class UserStore {
    constructor() {
        this.socket = io(socketUrl)
        this.getRooms()
        this.onSocketMethods()
        this.room = {}
        this.rooms = []
        this.player_x = 350
        this.player_y = 350
        this.userName = ""
        this.avatar = ""
        this.avatars = [
            {name: "red" , src: "./img/avatar_red.png"},
            {name: "white", src: "./img/avatar_white.png"},
            {name: "orange" , src: "./img/avatar_orange.png"},
            {name: "yellow", src: "./img/avatar_yellow.png"},
            {name: "pink" , src: "./img/avatar_pink.png"},
            {name: "purple", src: "./img/avatar_purple.png"},
            {name: "blue", src: "./img/avatar_blue.png"},
            {name: "cyan", src: "./img/avatar_cyan.png"},
            {name: "lime", src: "./img/avatar_lime.png"},
            {name: "black", src: "./img/avatar_black.png"},
        ]
        
        this.genres = ["Blues", "Classical", "Hip-Hop",
                        "Children", "Comedy", "Dance", "Electronic",
                        "Pop", "Jazz", "Anime", "K-Pop", "Opera",
                        "Rock", "Vocal", "Arabic" ]
    
        this.themes=[
            {name: "Icy", value: "theme1"},
            {name: "Sky", value: "theme2"},
            {name: "Thunder", value: "theme3"},
            {name: "Halloween1", value: "theme4"},
            {name: "Halloween2", value: "theme5"},
            {name: "WildZone", value: "theme6"},
            {name: "Medieval", value: "theme7"},
            {name: "Disco", value: "theme8"},
            {name: "DiscoStar", value: "theme9"},
            {name: "PlantWorld", value: "theme10"},
            {name: "DJ.Penguin", value: "theme11"},
            {name: "Splash", value: "theme12"},
            {name: "Astro", value: "theme13"},
            {name: "Snowy", value: "theme14"},
        ]
        
        makeObservable(this, {
            rooms: observable,
            userName: observable,
            avatar: observable,
            room: observable,
            player_x: observable,
            player_y: observable,
            createRoom: action,
            getRoom: action,
            getRooms: action,
            setRoom: action,
            addUser: action,
            suggestSong: action,
            LeaveRoom: action,
            addLike: action,
            deleteRoom: action,
        })
    }

    onSocketMethods() {
        this.socket.on('connect', () => {

        });

        this.socket.on('disconnect', () => {
            if (this.room) {
                this.LeaveRoom()
            }
            console.log("Disconnected");
        });
    }

    async getRooms() {
        try {
            const result = (await axios.get("http://localhost:4200/rooms")).data
            this.rooms = result
        } catch (error) {
            return error
        }
    }

    async setRoom(room) {
        this.room = room

    }

    compare(a, b) {
        if (a.guests.length > b.guests.length) {
            return -1
        } else if (a.guests.length < b.guests.length) {
            return 1
        } else {
            return 0
        }
    }

    getTop10() {
        return [...this.rooms].sort(this.compare)
    }

    async addLike(songID, unlike) {
        try {
            const value = unlike ? -1 : 1            
            this.room = (await axios.put(`http://localhost:4200/vote/${this.room._id}/${songID}/${value}`)).data
        } catch (error) {
            console.log(error)
        }
    }

    async createRoom(roomName, roomPassword, description, tags, theme) {
        //roomName, guests, roomPassword, host, description, tags, queue, theme, hostPassword, size
        try {
            const guests = []
            const host = this.socket.id
            const hostPassword = this.socket.id
            const room = { roomName, guests, roomPassword, host, description, tags, queue: [], theme, hostPassword, size: 10 }
            console.log(room)
            const response = (await axios.post("http://localhost:4200/room", room)).data
            console.log(response)
            await this.getRooms()
            this.room = response
        } catch (error) {
            console.log(error)
        }
    }

    async getRoom() {
        try {
            const result = (await axios.get(`http://localhost:4200/room`, this.room._id)).data
            this.room = result
        } catch (error) {
            console.log(error)
        }
    }

    async LeaveRoom(){
        try {   
            const response = (await axios.delete(`http://localhost:4200/delete/${this.room._id}/${this.socket.id}/guests`)).data
            this.room = null
            this.getRooms()
        } catch (error) {
            console.log(error)
        }
    }

    async deleteRoom() {
        try {
            const response = await axios.delete(`http://localhost:4200/room/${this.room._id}`)
            this.room = null
            this.getRooms()
        } catch (error) {
            console.log(error)
        }
    }

    async suggestSong(id, song) {
        try {
            const newVal = {newObj: {id, song, votes: 1}}
            this.room = (await axios.put(`http://localhost:4200/add/${this.room._id}/queue`, newVal)).data
            console.log(this.room)
        } catch (error) {
            console.log(error)
        }
    }

    async addUser(userName, avatar) {
        try {
            this.userName = userName
            this.avatar = this.avatars.find(a => a.name === avatar)
            this.room.guests.push({ id: this.socket.id, userName, avatar })
            const body = { field: 'guests', newVal: this.room.guests }
            this.room = (await axios.put(`http://localhost:4200/room/${this.room._id}`, body)).data
            this.socket.emit(JOIN_ROOM, {
                room: this.room._id,
                player: {
                    playerId: this.socket.id,
                    userName: this.userName,
                    avatar: this.avatar,
                    x: this.player_x,
                    y: this.player_y,
                    theme: this.room.theme
                }
            })
            this.socket.emit(ASK_FOR_VIDEO_INFORMATION);
        } catch (error) {
            console.log(error)
        }
    }

}