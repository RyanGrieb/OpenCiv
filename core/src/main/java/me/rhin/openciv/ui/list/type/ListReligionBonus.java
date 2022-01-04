package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.type.FoundPantheonNotification;
import me.rhin.openciv.game.religion.bonus.ReligionBonusType;
import me.rhin.openciv.game.religion.bonus.ReligionBonusType.ReligionProperty;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.window.type.ChoosePantheonWindow;

public class ListReligionBonus extends ListObject {

	private boolean hovered;
	private ReligionBonusType bonusType;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private Sprite bonusIcon;
	private CustomLabel bonusDescLabel;

	public ListReligionBonus(ReligionBonusType bonusType, float width, float height) {
		super(width, height, "Available Bonuses");

		this.bonusType = bonusType;

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.bonusIcon = bonusType.getIcon().sprite();
		bonusIcon.setSize(32, 32);

		this.bonusDescLabel = new CustomLabel(bonusType.getName() + ": \n" + bonusType.getDesc());

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {

				if (bonusType.getProperty() == ReligionProperty.PANTHEON) {
					PickPantheonPacket packet = new PickPantheonPacket();
					packet.setBonusID(bonusType.ordinal());
					Civilization.getInstance().getNetworkManager().sendPacket(packet);
				}

				Civilization.getInstance().getWindowManager().closeWindow(ChoosePantheonWindow.class);
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
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
		bonusDescLabel.setPosition(x + 40, y + 22);
	}

	public ReligionBonusType getBonusType() {
		return bonusType;
	}
}
