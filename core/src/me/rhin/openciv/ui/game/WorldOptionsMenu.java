package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.SetWorldSizeListener;
import me.rhin.openciv.shared.map.MapSize;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.IncreaseWorldSizeButton;
import me.rhin.openciv.ui.button.type.ReduceWorldSizeButton;
import me.rhin.openciv.ui.label.CustomLabel;

public class WorldOptionsMenu extends Group implements SetWorldSizeListener {

	private BlankBackground blankBackground;
	private CustomLabel worldOptionsLabel;
	private CustomLabel worldSizeDescLabel;
	private CustomLabel worldSizeLabel;
	private IncreaseWorldSizeButton increaseWorldSizeButton;
	private ReduceWorldSizeButton reduceWorldSizeButton;

	private int worldSize;

	public WorldOptionsMenu(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		this.blankBackground = new BlankBackground(0, 0, width, height);
		addActor(blankBackground);

		this.worldOptionsLabel = new CustomLabel("World Options");
		worldOptionsLabel.setSize(width, 15);
		worldOptionsLabel.setAlignment(Align.center);
		worldOptionsLabel.setPosition(0, height - 17);
		addActor(worldOptionsLabel);

		this.worldSizeDescLabel = new CustomLabel("World Size:");
		worldSizeDescLabel.setSize(width, 15);
		worldSizeDescLabel.setAlignment(Align.center);
		worldSizeDescLabel.setPosition(0, height - 40);
		addActor(worldSizeDescLabel);

		this.worldSizeLabel = new CustomLabel("Standard");
		worldSizeLabel.setSize(width, 15);
		worldSizeLabel.setAlignment(Align.center);
		worldSizeLabel.setPosition(0, height - 55);
		addActor(worldSizeLabel);

		this.increaseWorldSizeButton = new IncreaseWorldSizeButton(this, ">", width - 52, height - 72, 32, 32);
		addActor(increaseWorldSizeButton);

		this.reduceWorldSizeButton = new ReduceWorldSizeButton(this, "<", 20, height - 72, 32, 32);

		addActor(this.reduceWorldSizeButton);

		this.worldSize = 3; // Standard

		Civilization.getInstance().getEventManager().addListener(SetWorldSizeListener.class, this);
	}

	@Override
	public void setPosition(float x, float y) {

	}

	@Override
	public void onSetWorldSize(SetWorldSizePacket packet) {
		worldSizeLabel.setText(MapSize.values()[packet.getWorldSize()].getName());
		worldSizeLabel.setSize(getWidth(), 15);
		worldSizeLabel.setAlignment(Align.center);
		worldSizeLabel.setPosition(0, getHeight() - 55);
		this.worldSize = packet.getWorldSize();
	}

	public int getWorldSize() {
		return worldSize;
	}
}
