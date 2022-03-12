package me.rhin.openciv.ui.game;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input.Keys;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.Group;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.Touchable;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.type.PickResearchWindow;

public class TechnologyLeaf extends Group implements CompleteResearchListener {

	private Technology tech;
	private ColoredBackground background;
	private ColoredBackground icon;
	private ColoredBackground researchIcon;
	private CustomLabel techNameLabel;
	private Vector2 backVector;
	private Vector2 frontVector;
	private boolean positionUpdated;

	public TechnologyLeaf(final Technology tech, float x, float y, float width, float height) {
		this.tech = tech;
		this.setTouchable(Touchable.enabled);
		this.setBounds(x, y, width, height);

		Sprite sprite = null;

		if (tech.isResearched())
			sprite = TextureEnum.UI_GREEN.sprite();
		else if (tech.hasResearchedRequiredTechs())
			sprite = TextureEnum.UI_YELLOW.sprite();
		else
			sprite = TextureEnum.UI_RED.sprite();

		this.background = new ColoredBackground(sprite, 0, 0, width, height);
		addActor(background);

		this.icon = new ColoredBackground(tech.getIcon(), 2, 6, 32, 32);
		addActor(icon);

		this.researchIcon = new ColoredBackground(TextureEnum.ICON_SCIENCE.sprite(), width / 2 - 16 / 2, height - 18,
				16, 16);

		if (tech.isResearching())
			addActor(researchIcon);

		// FIXME: Setting the label to a height > 0 causes click input isses.
		this.techNameLabel = new CustomLabel(tech.getName(), icon.getX() + icon.getWidth() + 3, height - 25, width, 0);
		addActor(techNameLabel);

		this.backVector = new Vector2(x, y + height / 2);
		this.frontVector = new Vector2(x + width, y + height / 2);

		addListener(new ClickListener() {

			@Override
			public void clicked(InputEvent event, float x, float y) {

				if (Gdx.input.isKeyPressed(Keys.SHIFT_LEFT)) {
					// TODO: Allow shift left of techs.
				}

				if (!Civilization.getInstance().getWindowManager().allowsInput(event.getListenerActor())
						|| tech.isResearched()) {
					return;
				}

				Civilization.getInstance().getWindowManager().addWindow(new PickResearchWindow(tech));
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
			}
		});

		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (packet.getTechID() != tech.getID()) {
			Technology completedTech = Technology.fromID(packet.getTechID());
			for (Class<? extends Technology> requiredTechClazz : tech.getRequiredTechs()) {
				Technology requiredTech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
						.getTechnology(requiredTechClazz);

				if (requiredTech.equals(completedTech) && tech.hasResearchedRequiredTechs()) {
					background.setSprite(TextureEnum.UI_YELLOW.sprite());
					background.setBounds(0, 0, getWidth(), getHeight());
				}

			}
			return;
		}
		background.setSprite(TextureEnum.UI_GREEN.sprite());
		background.setBounds(0, 0, getWidth(), getHeight());
		removeActor(researchIcon);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);

		backVector.set(x, y + getHeight() / 2);
		frontVector.set(x + getWidth(), y + getHeight() / 2);
		positionUpdated = true;
	}

	public Technology getTech() {
		return tech;
	}

	public void setPositionUpdated(boolean positionUpdated) {
		this.positionUpdated = positionUpdated;
	}

	public boolean isPositionUpdated() {
		return positionUpdated;
	}

	public void onClicked() {
		// Start researching the tech, ect.
		// LOGGER.info("Research: " + tech.getName());
	}

	public Vector2 getBackVector() {
		return backVector;
	}

	public Vector2 getFrontVector() {
		return frontVector;
	}

	public void setResearching(boolean researching) {
		if (researching)
			addActor(researchIcon);
		else
			removeActor(researchIcon);
	}
}
