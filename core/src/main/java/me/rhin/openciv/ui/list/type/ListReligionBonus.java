package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.InputListener;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.religion.ReligionProperty;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.window.type.ChoosePantheonWindow;
import me.rhin.openciv.ui.window.type.FoundReligionWindow;

public class ListReligionBonus extends ListObject {

	private boolean hovered;
	private ReligionBonus religionBonus;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private Sprite bonusIcon;
	private CustomLabel bonusDescLabel;

	public ListReligionBonus(ReligionBonus religionBonus, ContainerList containerList, float width, float height) {
		super(width, height, containerList, "Available Bonuses");

		this.religionBonus = religionBonus;

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.bonusIcon = religionBonus.getIcon().sprite();
		bonusIcon.setSize(32, 32);

		this.bonusDescLabel = new CustomLabel(religionBonus.getName() + ": \n" + religionBonus.getDesc());

		this.addListener(new InputListener() {
			@Override
			public boolean mouseMoved(InputEvent event, float x, float y) {

				if (!inContainerListBounds())
					hovered = false;
				else
					hovered = true;

				return false;
			}
		});

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {

				if (!inContainerListBounds())
					return;

				if (religionBonus.getProperty() == ReligionProperty.PANTHEON) {
					PickPantheonPacket packet = new PickPantheonPacket();
					packet.setBonusID(religionBonus.getID());
					Civilization.getInstance().getNetworkManager().sendPacket(packet);

					Civilization.getInstance().getWindowManager().closeWindow(ChoosePantheonWindow.class);
				}

				if (religionBonus.getProperty() == ReligionProperty.FOUNDER_BELIEF) {
					FoundReligionWindow window = Civilization.getInstance().getWindowManager()
							.getWindow(FoundReligionWindow.class);

					window.getBonusContianerList().clearList();
					window.removeActor(window.getBonusContianerList());
					window.removeActor(window.getBonusContianerList().getScrollbar());

					window.setFounderBeliefText(religionBonus.getName() + ":\n" + religionBonus.getDesc());
					window.setFounderBelief(religionBonus);

					window.checkFoundableCondition();
				}

				if (religionBonus.getProperty() == ReligionProperty.FOLLOWER_BELIEF) {
					FoundReligionWindow window = Civilization.getInstance().getWindowManager()
							.getWindow(FoundReligionWindow.class);

					window.getBonusContianerList().clearList();
					window.removeActor(window.getBonusContianerList());
					window.removeActor(window.getBonusContianerList().getScrollbar());

					window.setFollowerBeliefText(religionBonus.getName() + ":\n" + religionBonus.getDesc());
					window.setFollowerBelief(religionBonus);

					window.checkFoundableCondition();
				}
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				if (!inContainerListBounds())
					return;

				hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				if (!inContainerListBounds())
					hovered = false;

				hovered = false;
			}
		});
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);

		bonusIcon.draw(batch);
		bonusDescLabel.draw(batch, parentAlpha);
		// FIXME: Ordering looks weird..
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		bonusIcon.setPosition(4, y + (getHeight() / 2) - 12);
		bonusDescLabel.setPosition(x + 40, y + getHeight() - bonusDescLabel.getHeight() - 4);
	}

	public ReligionBonus getBonusType() {
		return religionBonus;
	}
}
