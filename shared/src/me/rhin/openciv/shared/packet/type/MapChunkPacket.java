package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class MapChunkPacket extends Packet {

	public static final int CHUNK_SIZE = 4;

	private int[][] topTileChunk;
	private int[][] bottomTileChunk;
	private int chunkX, chunkY;

	@Override
	public void write(Json json) {
		super.write(json);
		// TODO: Find a better way to store a 2D array /w libgdx json limiting me.
		for (int i = 0; i < CHUNK_SIZE; i++) {
			json.writeValue("t" + i, topTileChunk[i]);
			json.writeValue("b" + i, bottomTileChunk[i]);
		}
		json.writeValue("chunkX", chunkX);
		json.writeValue("chunkY", chunkY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.topTileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];
		this.bottomTileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];

		for (int i = 0; i < CHUNK_SIZE; i++) {
			topTileChunk[i] = jsonData.get("t" + i).asIntArray();
			bottomTileChunk[i] = jsonData.get("b" + i).asIntArray();
		}

		this.chunkX = jsonData.getInt("chunkX");
		this.chunkY = jsonData.getInt("chunkY");
	}

	public void setTileCunk(int[][] topTileChunk, int[][] bottomTileChunk) {
		this.topTileChunk = topTileChunk;
		this.bottomTileChunk = bottomTileChunk;
	}

	public int[][] getTopTileChunk() {
		return topTileChunk;
	}

	public int[][] getBottomTileChunk() {
		return bottomTileChunk;
	}

	public int getChunkX() {
		return chunkX;
	}

	public int getChunkY() {
		return chunkY;
	}

	public void setChunkLocation(int chunkX, int chunkY) {
		this.chunkX = chunkX;
		this.chunkY = chunkY;
	}
}
