package me.rhin.openciv.shared.packet.type;

import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;

import me.rhin.openciv.shared.packet.Packet;

public class MapChunkPacket extends Packet {

	public static final int CHUNK_SIZE = 4;

	private int[][] tileChunk;
	private int chunkX, chunkY;

	public MapChunkPacket() {
		super(MapChunkPacket.class.getName());
	}

	@Override
	public void write(Json json) {
		super.write(json);
		// TODO: Find a better way to store a 2D array /w libgdx json limiting me.
		for (int i = 0; i < CHUNK_SIZE; i++)
			json.writeValue("t" + i, tileChunk[i]);

		json.writeValue("chunkX", chunkX);
		json.writeValue("chunkY", chunkY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);
		this.tileChunk = new int[CHUNK_SIZE][CHUNK_SIZE];

		for (int i = 0; i < CHUNK_SIZE; i++) {
			tileChunk[i] = jsonData.get("t" + i).asIntArray();
		}

		this.chunkX = jsonData.getInt("chunkX");
		this.chunkY = jsonData.getInt("chunkY");
	}

	public void setTileCunk(int[][] tileChunk) {
		this.tileChunk = tileChunk;
	}

	public int[][] getTileChunk() {
		return tileChunk;
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
