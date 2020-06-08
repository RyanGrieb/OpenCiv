package me.rhin.openciv.shared.packet.type;

import java.util.ArrayList;

public class PlayerListRequestPacket {

	public String packetName;

	public PlayerListRequestPacket() {
		this.packetName = "PlayerListRequestPacket";
	}

	private ArrayList<String> playerList;

	public void setPlayerList(ArrayList<String> playerList) {
		this.playerList = playerList;
	}

}
