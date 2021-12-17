package me.rhin.openciv.server.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.server.game.research.type.ArcheryTech;
import me.rhin.openciv.server.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.server.game.research.type.CalendarTech;
import me.rhin.openciv.server.game.research.type.CivilServiceTech;
import me.rhin.openciv.server.game.research.type.ConstructionTech;
import me.rhin.openciv.server.game.research.type.CurrencyTech;
import me.rhin.openciv.server.game.research.type.DramaPoetryTech;
import me.rhin.openciv.server.game.research.type.EngineeringTech;
import me.rhin.openciv.server.game.research.type.GuildsTech;
import me.rhin.openciv.server.game.research.type.HorsebackRidingTech;
import me.rhin.openciv.server.game.research.type.IronWorkingTech;
import me.rhin.openciv.server.game.research.type.MasonryTech;
import me.rhin.openciv.server.game.research.type.MathematicsTech;
import me.rhin.openciv.server.game.research.type.MetalCastingTech;
import me.rhin.openciv.server.game.research.type.MiningTech;
import me.rhin.openciv.server.game.research.type.OpticsTech;
import me.rhin.openciv.server.game.research.type.PhilosophyTech;
import me.rhin.openciv.server.game.research.type.PotteryTech;
import me.rhin.openciv.server.game.research.type.SailingTech;
import me.rhin.openciv.server.game.research.type.TheologyTech;
import me.rhin.openciv.server.game.research.type.TrappingTech;
import me.rhin.openciv.server.game.research.type.WheelTech;
import me.rhin.openciv.server.game.research.type.WritingTech;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.stat.Stat;

public class ResearchTree implements NextTurnListener {

	private AbstractPlayer player;
	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;
	private Technology techResearching;
	private int techIDIndex;

	public ResearchTree(AbstractPlayer player) {
		this.player = player;
		this.technologies = new LinkedHashMap<>();
		this.techIDIndex = 0;

		// FIXME: This is going to be a crappton of techs
		technologies.put(PotteryTech.class, new PotteryTech(this));
		technologies.put(AnimalHusbandryTech.class, new AnimalHusbandryTech(this));
		technologies.put(ArcheryTech.class, new ArcheryTech(this));
		technologies.put(MiningTech.class, new MiningTech(this));
		technologies.put(SailingTech.class, new SailingTech(this));
		technologies.put(CalendarTech.class, new CalendarTech(this));
		technologies.put(WritingTech.class, new WritingTech(this));
		technologies.put(TrappingTech.class, new TrappingTech(this));
		technologies.put(WheelTech.class, new WheelTech(this));
		technologies.put(MasonryTech.class, new MasonryTech(this));
		technologies.put(BronzeWorkingTech.class, new BronzeWorkingTech(this));
		technologies.put(OpticsTech.class, new OpticsTech(this));
		technologies.put(PhilosophyTech.class, new PhilosophyTech(this));
		technologies.put(DramaPoetryTech.class, new DramaPoetryTech(this));
		technologies.put(HorsebackRidingTech.class, new HorsebackRidingTech(this));
		technologies.put(MathematicsTech.class, new MathematicsTech(this));
		technologies.put(ConstructionTech.class, new ConstructionTech(this));
		technologies.put(IronWorkingTech.class, new IronWorkingTech(this));
		technologies.put(TheologyTech.class, new TheologyTech(this));
		technologies.put(CivilServiceTech.class, new CivilServiceTech(this));
		technologies.put(GuildsTech.class, new GuildsTech(this));
		technologies.put(CurrencyTech.class, new CurrencyTech(this));
		technologies.put(EngineeringTech.class, new EngineeringTech(this));
		technologies.put(MetalCastingTech.class, new MetalCastingTech(this));

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn() {

		if (techResearching == null || !player.hasConnection())
			return;

		techResearching.applyScience(player.getStatLine().getStatValue(Stat.SCIENCE_GAIN));

		if (techResearching.getAppliedScience() >= techResearching.getScienceCost()) {
			techResearching.setResearched(true);

			CompleteResearchPacket packet = new CompleteResearchPacket();
			packet.setTech(techResearching.getID());

			Json json = new Json();
			player.sendPacket(json.toJson(packet));

			techResearching = null;
		}
	}

	public List<Technology> getTechnologies() {
		// FIXME: This seems dumb
		return new ArrayList<>(technologies.values());
	}

	public <T extends Technology> boolean hasResearched(Class<T> technologyClass) {
		if (technologyClass == null)
			return true;

		return technologies.get(technologyClass).isResearched();
	}

	public Technology getTechnology(Class<? extends Technology> clazz) {
		return technologies.get(clazz);
	}

	public void chooseTech(int techID) {
		techResearching = getTechnologies().get(techID);
		// System.out.println("Researching: " + techResearching.getName());
	}

	public void chooseTech(Technology technology) {
		techResearching = technology;
		// System.out.println("Researching: " + techResearching.getName());
	}

	public int getCurrentTechIDIndex() {
		return techIDIndex++;
	}

	public AbstractPlayer getPlayerOwner() {
		return player;
	}

	public Technology getTechResearching() {
		return techResearching;
	}
}
