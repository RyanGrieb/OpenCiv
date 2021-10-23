package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.game.unit.type.Caravan.Tradeable;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListTradeableCity;
import me.rhin.openciv.ui.list.type.ListUntradeableCity;
import me.rhin.openciv.ui.window.AbstractWindow;

public class TradeWindow extends AbstractWindow implements ResizeListener {

	private CaravanUnit caravanUnit;
	private ColoredBackground background;
	private ContainerList containerList;
	private CustomLabel titleLabel;
	private CloseWindowButton closeWindowButton;

	public TradeWindow(CaravanUnit caravanUnit) {
		// NOTE: We don't use super.setBounds() since libgdx listeners don't work
		// relative to abstract window.
		float x = viewport.getWorldWidth() / 2 - 285 / 2;
		float y = viewport.getWorldHeight() / 2 - 350 / 2;
		float width = 285;
		float height = 350;
		this.caravanUnit = caravanUnit;
		this.background = new ColoredBackground(TextureEnum.UI_GRAY.sprite(), x, y, width, height);
		addActor(background);

		this.titleLabel = new CustomLabel("Trade with cities", Align.center, x, y + height - 15, width, 15);
		addActor(titleLabel);

		this.containerList = new ContainerList(this, x + 6, y + 50, width - 32, height - 75);

		for (City city : Civilization.getInstance().getGame().getCities()) {
			// TODO: Calculate trade distance from city.
			Tradeable tradeable = caravanUnit.canTrade(city);
			if (tradeable.isTradeable()) {
				containerList.addItem(ListContainerType.CATEGORY, "Tradeable Cities",
						new ListTradeableCity(city, caravanUnit, width, 45));
			} else {
				containerList.addItem(ListContainerType.CATEGORY, "Untradeable Cities",
						new ListUntradeableCity(city, tradeable.getReason(), width, 45));
			}
		}

		addActor(containerList);

		closeWindowButton = new CloseWindowButton(getClass(), "Cancel", x + width / 2 - 95 / 2, y + 4, 95, 35);
		addActor(closeWindowButton);

		// FIXME: We do this since the libgdx drag listener doesn't work.
		this.addListener(new ClickListener() {
			@Override
			public void touchDragged(InputEvent event, float x, float y, int pointer) {
				containerList.onTouchDragged(event, x, y);
			}
		});

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		float x = width / 2 - 285 / 2;
		float y = height / 2 - 350 / 2;
		float windowWidth = 285;
		float windowHeight = 350;
		background.setPosition(x, y);
		titleLabel.setPosition(x, y + windowHeight - 15);
		containerList.setPosition(x + 6, y + 50);
		closeWindowButton.setPosition(x + windowWidth / 2 - 95 / 2, y + 4);

	}

	@Override
	public void onClose() {
		super.onClose();
		containerList.onClose();
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return true;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}
}
