package me.rhin.openciv.shared.packet.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Json;
import com.badlogic.gdx.utils.JsonValue;
import com.badlogic.gdx.utils.JsonWriter.OutputType;

import me.rhin.openciv.shared.packet.ChunkListContainer;
import me.rhin.openciv.shared.packet.ChunkTile;
import me.rhin.openciv.shared.packet.Packet;

public class MapChunkPacket extends Packet {

	public static final int CHUNK_SIZE = 4;

	private ChunkListContainer chunkListContainer;
	private int chunkX, chunkY;

	@Override
	public void write(Json json) {
		super.write(json);

		json.writeFields(chunkListContainer);
		// json.setElementType(ChunkListContainer.class, "tiles", ChunkTile.class);

		json.writeValue("chunkX", chunkX);
		json.writeValue("chunkY", chunkY);
	}

	@Override
	public void read(Json json, JsonValue jsonData) {
		super.read(json, jsonData);

		this.chunkListContainer = new ChunkListContainer();

		chunkListContainer.setTiles(
				json.fromJson(ArrayList.class, ChunkTile.class, jsonData.get("tiles").toJson(OutputType.json)));
		this.chunkX = jsonData.getInt("chunkX");
		this.chunkY = jsonData.getInt("chunkY");
	}

	public void setChunkTiles(ArrayList<ChunkTile> chunkTiles) {
		this.chunkListContainer = new ChunkListContainer();
		this.chunkListContainer.setTiles(chunkTiles);
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

	public ArrayList<ChunkTile> getChunkTiles() {
		return chunkListContainer.getTiles();
	}
}
