package me.rhin.openciv.ui.game;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.listener.PlayerStatUpdateListener;
import me.rhin.openciv.listener.TurnTimeLeftListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.TurnTimeLeftPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.ui.label.CustomLabel;

public class StatusBar extends Actor implements PlayerStatUpdateListener, NextTurnListener, TurnTimeLeftListener {

	private Sprite sprite;

	private CustomLabel scienceDescLabel, heritageDescLabel, goldDescLabel;
	private Sprite scienceIcon, heritageIcon, goldIcon;
	private CustomLabel scienceLabel, hertiageLabel, goldLabel;

	private CustomLabel turnsLabel;

	public StatusBar(float x, float y, float width, float height) {
		this.setPosition(x, y);
		this.setSize(width, height);
		this.sprite = TextureEnum.UI_BLACK.sprite();

		this.scienceDescLabel = new CustomLabel("Science:");
		this.scienceIcon = TextureEnum.ICON_SCIENCE.sprite();
		scienceIcon.setSize(16, 16);
		this.scienceLabel = new CustomLabel("0");

		this.heritageDescLabel = new CustomLabel("Heritage:");
		this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		heritageIcon.setSize(16, 16);
		this.hertiageLabel = new CustomLabel("0");

		this.goldDescLabel = new CustomLabel("Gold:");
		this.goldIcon = TextureEnum.ICON_GOLD.sprite();
		goldIcon.setSize(16, 16);
		this.goldLabel = new CustomLabel("0");

		this.turnsLabel = new CustomLabel("Turns: 0 (0s)");

		updatePositions();

		Civilization.getInstance().getEventManager().addListener(PlayerStatUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TurnTimeLeftListener.class, this);
	}

	@Override
	public void setSize(float width, float height) {
		super.setSize(width, height);
		if (sprite != null) {
			sprite.setSize(width, height);
			updatePositions();
		}
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		if (sprite != null) {
			sprite.setPosition(x, y);
			updatePositions();
		}
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		sprite.draw(batch);

		scienceDescLabel.draw(batch, parentAlpha);
		heritageDescLabel.draw(batch, parentAlpha);
		goldDescLabel.draw(batch, parentAlpha);

		scienceIcon.draw(batch);
		heritageIcon.draw(batch);
		goldIcon.draw(batch);

		scienceLabel.draw(batch, parentAlpha);
		hertiageLabel.draw(batch, parentAlpha);
		goldLabel.draw(batch, parentAlpha);

		turnsLabel.draw(batch, parentAlpha);
	}

	@Override
	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet) {
		StatLine statLine = StatLine.fromPacket(packet);

		scienceLabel.setText("+" + (int) statLine.getStatValue(Stat.SCIENCE_GAIN));

		int currentGold = (int) statLine.getStatValue(Stat.GOLD);
		int gainedGold = (int) statLine.getStatValue(Stat.GOLD_GAIN);
		goldLabel.setText("" + currentGold + "(" + (gainedGold < 0 ? "-" : "+") + gainedGold + ")");

		hertiageLabel.setText(
				(int) statLine.getStatValue(Stat.HERITAGE) + "/" + (int) statLine.getStatValue(Stat.POLICY_COST) + "(+"
						+ (int) statLine.getStatValue(Stat.HERITAGE_GAIN) + ")");

		updatePositions();
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		turnsLabel.setText("Turns: " + Civilization.getInstance().getGame().getTurn() + "("
				+ Civilization.getInstance().getGame().getTurnTime() + "s)");
		updatePositions();
	}

	@Override
	public void onTurnTimeLeft(TurnTimeLeftPacket packet) {
		turnsLabel.setText("Turns: " + Civilization.getInstance().getGame().getTurn() + "(" + packet.getTime() + "s)");
		updatePositions();
	}

	private void updatePositions() {
		float x = getX();
		float y = getY();
		float originX = x + 3;

		scienceDescLabel.setPosition(originX, y + scienceDescLabel.getHeight() / 2);

		originX += scienceDescLabel.getWidth() + 5;
		scienceIcon.setPosition(originX, y + 1);

		originX += scienceIcon.getWidth() + 5;
		scienceLabel.setPosition(originX, y + scienceLabel.getHeight() / 2);

		originX += scienceLabel.getWidth() + 15;
		heritageDescLabel.setPosition(originX, y + heritageDescLabel.getHeight() / 2);

		originX += heritageDescLabel.getWidth() + 5;
		heritageIcon.setPosition(originX, y + 1);

		originX += heritageIcon.getWidth() + 5;
		hertiageLabel.setPosition(originX, y + hertiageLabel.getHeight() / 2);

		originX += hertiageLabel.getWidth() + 15;
		goldDescLabel.setPosition(originX, y + goldDescLabel.getHeight() / 2);

		originX += goldDescLabel.getWidth() + 5;
		goldIcon.setPosition(originX, y + 2);

		originX += goldIcon.getWidth() + 5;
		goldLabel.setPosition(originX, y + goldLabel.getHeight() / 2);

		turnsLabel.setPosition(getWidth() - turnsLabel.getWidth() - 2, y + 5);
	}
}
