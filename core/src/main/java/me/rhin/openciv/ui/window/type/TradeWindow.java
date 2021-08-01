package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.game.unit.type.Caravan.Tradeable;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListTradeableCity;
import me.rhin.openciv.ui.list.type.ListUntradeableCity;
import me.rhin.openciv.ui.window.AbstractWindow;

public class TradeWindow extends AbstractWindow {

	private CaravanUnit caravanUnit;
	private ColoredBackground background;
	private ContainerList containerList;
	private CustomLabel titleLabel;
	private CloseWindowButton closeWindowButton;

	public TradeWindow(CaravanUnit caravanUnit) {
		this.setBounds(viewport.getWorldWidth() / 2 - 250 / 2, viewport.getWorldHeight() / 2 - 350 / 2, 250, 350);
		this.caravanUnit = caravanUnit;
		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		addActor(background);

		this.titleLabel = new CustomLabel("Trade with cities", Align.center, 0, getHeight() - 15, getWidth(), 15);
		addActor(titleLabel);

		this.containerList = new ContainerList(6, 50, getWidth() - 12, getHeight() - 75);

		for (City city : Civilization.getInstance().getGame().getCities()) {
			// TODO: Calculate trade distance from city.
			Tradeable tradeable = caravanUnit.canTrade(city);
			if (tradeable.isTradeable()) {
				containerList.addItem(ListContainerType.CATEGORY, "Tradeable Cities",
						new ListTradeableCity(city, caravanUnit, getWidth(), 45));
			} else {
				containerList.addItem(ListContainerType.CATEGORY, "Untradeable Cities",
						new ListUntradeableCity(city, tradeable.getReason(), getWidth(), 45));
			}
		}

		addActor(containerList);

		closeWindowButton = new CloseWindowButton(getClass(), "Cancel", getWidth() / 2 - 95 / 2, 4, 95, 35);
		addActor(closeWindowButton);
	}

	@Override
	public boolean disablesInput() {
		return true;
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
