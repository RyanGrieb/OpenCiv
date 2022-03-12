package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.research.type.ArcheryTech;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.game.research.type.CivilServiceTech;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.game.research.type.CurrencyTech;
import me.rhin.openciv.game.research.type.DramaPoetryTech;
import me.rhin.openciv.game.research.type.EngineeringTech;
import me.rhin.openciv.game.research.type.GuildsTech;
import me.rhin.openciv.game.research.type.HorsebackRidingTech;
import me.rhin.openciv.game.research.type.IronWorkingTech;
import me.rhin.openciv.game.research.type.MachineryTech;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.game.research.type.MathematicsTech;
import me.rhin.openciv.game.research.type.MetalCastingTech;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.game.research.type.PhilosophyTech;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.research.type.TheologyTech;
import me.rhin.openciv.game.research.type.TrappingTech;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;

public class ResearchTree implements PickResearchListener, CompleteResearchListener {

	private AbstractPlayer player;
	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;
	private ArrayList<Class<? extends Technology>> techQueue;
	private Technology researchingTech;
	private int techIDIndex;

	public ResearchTree(AbstractPlayer player) {
		this.player = player;
		this.technologies = new LinkedHashMap<>();
		// this.techQueue = new ArrayList<>();
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
		technologies.put(MachineryTech.class, new MachineryTech(this));

		// FIXME: Don't add listeners for other players
		Civilization.getInstance().getEventManager().addListener(PickResearchListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	public List<Technology> getTechnologies() {
		// FIXME: This seems dumb
		return new ArrayList<>(technologies.values());
	}

	public <T extends Technology> boolean hasResearched(Class<T> technologyClass) {
		return technologies.get(technologyClass).isResearched();
	}

	public Technology getTechnology(Class<? extends Technology> clazz) {
		return technologies.get(clazz);
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		if (!player.equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		if (techQueue != null && techQueue.contains(researchingTech.getClass())) {

			techQueue.remove(researchingTech.getClass());

			if (techQueue.size() > 0)
				getTechnology(techQueue.get(0)).research();
			else
				techQueue = null;

			return;
		}

		researchingTech = null;
	}

	@Override
	public void onPickResearch(Technology tech) {
		if (!player.equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		researchingTech = tech;
	}

	public boolean isResearching() {
		return researchingTech != null;
	}

	public int getCurrentTechIDIndex() {
		return techIDIndex++;
	}

	public void setTechQueue(ArrayList<Class<? extends Technology>> techQueue) {
		this.techQueue = techQueue;
		getTechnology(techQueue.get(0)).research();
	}
}
