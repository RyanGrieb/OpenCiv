package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;
import me.rhin.openciv.ui.button.Button;

public class WorkedTileButton extends Button {

	private Tile tile;

	public WorkedTileButton(WorkerType workerType, Tile tile, float x, float y, float width, float height) {
		super(TextureEnum.ICON_CITIZEN_UNWORKED, "", x, y, width, height);
		this.tile = tile;

		switch (workerType) {
		case ASSIGNED:
			this.setTexture(TextureEnum.ICON_CITIZEN);
			break;
		case CITY_CENTER:
			this.setTexture(TextureEnum.ICON_CITIZEN_CITY_CENTER);
			break;
		case EMPTY:
			this.setTexture(TextureEnum.ICON_CITIZEN_UNWORKED);
			break;
		case LOCKED:
			this.setTexture(TextureEnum.ICON_CITIZEN_LOCK);
			break;
		case UNEMPLOYED:
			break;
		default:
			break;
		}
	}

	@Override
	public void onClick() {
		ClickWorkedTilePacket packet = new ClickWorkedTilePacket();
		packet.setTile(tile.getTerritory().getName(), tile.getGridX(), tile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

}
