package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.SetTurnLengthListener;
import me.rhin.openciv.listener.SetWorldSizeListener;
import me.rhin.openciv.shared.map.MapSize;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.ui.background.BlankBackground;
import me.rhin.openciv.ui.button.type.IncreaseTurnLengthButton;
import me.rhin.openciv.ui.button.type.IncreaseWorldSizeButton;
import me.rhin.openciv.ui.button.type.ReduceTurnLengthButton;
import me.rhin.openciv.ui.button.type.ReduceWorldSizeButton;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameOptionsMenu extends Group implements SetWorldSizeListener, SetTurnLengthListener {

	private BlankBackground blankBackground;
	private CustomLabel worldOptionsLabel;
	private CustomLabel worldSizeDescLabel;
	private CustomLabel worldSizeLabel;
	private IncreaseWorldSizeButton increaseWorldSizeButton;
	private ReduceWorldSizeButton reduceWorldSizeButton;

	private CustomLabel turnOptionDescLabel;
	private CustomLabel turnLengthLabel;

	private IncreaseTurnLengthButton increaseTurnLengthButton;
	private ReduceTurnLengthButton reduceTurnLengthButton;

	private int worldSize;
	private int turnLengthOffset;

	public GameOptionsMenu(float x, float y, float width, float height) {
		super.setBounds(x, y, width, height);

		this.blankBackground = new BlankBackground(0, 0, width, height);
		addActor(blankBackground);

		this.worldOptionsLabel = new CustomLabel("Game Options");
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

		this.turnOptionDescLabel = new CustomLabel("Turn Length:", Align.center, 0, height - 95, width, 15);
		addActor(turnOptionDescLabel);

		this.turnLengthLabel = new CustomLabel("Dynamic", Align.center, 0, height - 110, width, 15);
		addActor(turnLengthLabel);

		this.increaseTurnLengthButton = new IncreaseTurnLengthButton(this, ">", width - 52, height - 125, 32, 32);
		addActor(increaseTurnLengthButton);

		this.reduceTurnLengthButton = new ReduceTurnLengthButton(this, "<", 20, height - 125, 32, 32);
		addActor(reduceTurnLengthButton);

		this.worldSize = 3; // Standard
		this.turnLengthOffset = -1; // Dynamic

		Civilization.getInstance().getEventManager().addListener(SetWorldSizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetTurnLengthListener.class, this);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		blankBackground.setPosition(0, 0);
		worldOptionsLabel.setPosition(0, getHeight() - 17);
		worldSizeDescLabel.setPosition(0, getHeight() - 40);
		worldSizeLabel.setPosition(0, getHeight() - 55);
		increaseWorldSizeButton.setPosition(getWidth() - 52, getHeight() - 72);
		reduceWorldSizeButton.setPosition(20, getHeight() - 72);
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

	public int getTurnLengthOffset() {
		return turnLengthOffset;
	}

	@Override
	public void onSetTurnLength(SetTurnLengthPacket packet) {

		this.turnLengthOffset = packet.getTurnLengthOffset();

		if (turnLengthOffset < 0)
			turnLengthLabel.setText("Dynamic");
		else if (turnLengthOffset == 0)
			turnLengthLabel.setText("No Timer");
		else
			turnLengthLabel.setText(30 + (5 * turnLengthOffset) + " Seconds");

		turnLengthLabel.setBounds(0, getHeight() - 110, getWidth(), 15);
	}
}
