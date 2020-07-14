package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class MapChunkPacket extends Packet {

	public static final int CHUNK_SIZE = 4;

	private int[][] luxuryTileChunk;
	private int[][] layeredTileChunk;
	private int[][] baseTileChunk;
	private int chunkX, chunkY;

	@Override
	public void write(Json json) {
		super.write(json);
		// TODO: Find a better way to store a 2D array /w libgdx json limiting me.
		for (int i = 0; i < CHUNK_SIZE; i++) {
			json.writeValue("l3" + i, luxuryTileChunk[i]);
			json.writeValue("l2" + i, layeredTileChunk[i]);
			json.writeValue("l1" + i, baseTileChunk[i]);
		}
		json.writeValue("chunkX", chunkX);
		json.writeValue("chunkY", chunkY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.luxuryTileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];
		this.layeredTileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];
		this.baseTileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];

		for (int i = 0; i < CHUNK_SIZE; i++) {
			luxuryTileChunk[i] = jsonData.get("l3" + i).asIntArray();
			layeredTileChunk[i] = jsonData.get("l2" + i).asIntArray();
			baseTileChunk[i] = jsonData.get("l1" + i).asIntArray();
		}

		this.chunkX = jsonData.getInt("chunkX");
		this.chunkY = jsonData.getInt("chunkY");
	}

	public void setTileCunk(int[][] luxuryTileChunk, int[][] layeredTileChunk, int[][] baseTileChunk) {
		this.luxuryTileChunk = luxuryTileChunk;
		this.layeredTileChunk = layeredTileChunk;
		this.baseTileChunk = baseTileChunk;
	}

	public int[][] getLuxuryTileChunk() {
		return luxuryTileChunk;
	}

	public int[][] getLayeredTileChunk() {
		return layeredTileChunk;
	}

	public int[][] getBaseTileChunk() {
		return baseTileChunk;
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
