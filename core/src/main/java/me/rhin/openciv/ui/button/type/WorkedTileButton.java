package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.ClickWorkedTilePacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket.WorkerType;
import me.rhin.openciv.ui.button.AbstractButton;

public class WorkedTileButton extends AbstractButton {

	private Tile tile;

	public WorkedTileButton(WorkerType workerType, Tile tile, float x, float y, float width, float height) {
		super(TextureEnum.ICON_CITIZEN_UNWORKED, TextureEnum.ICON_CITIZEN_UNWORKED, x, y, width, height);
		this.tile = tile;

		this.setTexture(getTextureFromWorkerType(workerType));
	}

	public static TextureEnum getTextureFromWorkerType(WorkerType workerType) {
		switch (workerType) {
		case ASSIGNED:
			return TextureEnum.ICON_CITIZEN;
		case CITY_CENTER:
			return TextureEnum.ICON_CITIZEN_CITY_CENTER;
		case EMPTY:
			return TextureEnum.ICON_CITIZEN_UNWORKED;
		case LOCKED:
			return TextureEnum.ICON_CITIZEN_LOCKED;
		case UNEMPLOYED:
		default:
			return null;
		}
	}

	@Override
	public void onClicked() {
		ClickWorkedTilePacket packet = new ClickWorkedTilePacket();
		packet.setTile(tile.getTerritory().getName(), tile.getGridX(), tile.getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}
}
