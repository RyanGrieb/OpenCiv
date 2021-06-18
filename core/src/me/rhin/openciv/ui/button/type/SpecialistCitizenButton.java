package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.specialist.SpecialistContainer;
import me.rhin.openciv.shared.packet.type.ClickSpecialistPacket;
import me.rhin.openciv.ui.button.Button;

public class SpecialistCitizenButton extends Button {

	private City city;
	private SpecialistContainer specialistContainer;

	public SpecialistCitizenButton(City city, SpecialistContainer specialistContainer, float x, float y, float width,
			float height) {
		super(TextureEnum.ICON_UNEMPLOYED_CITIZEN, "", x, y, width, height);

		this.hoveredSprite = TextureEnum.ICON_UNEMPLOYED_CITIZEN.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		this.city = city;
		this.specialistContainer = specialistContainer;
	}

	@Override
	public void onClick() {
		ClickSpecialistPacket packet = new ClickSpecialistPacket();
		packet.setContainer(city.getName(), specialistContainer.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

}
