package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.research.type.ArcheryTech;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.research.type.CalendarTech;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.game.research.type.CurrencyTech;
import me.rhin.openciv.game.research.type.EngineeringTech;
import me.rhin.openciv.game.research.type.HorsebackRridingTech;
import me.rhin.openciv.game.research.type.IronWorkingTech;
import me.rhin.openciv.game.research.type.MasonryTech;
import me.rhin.openciv.game.research.type.MathematicsTech;
import me.rhin.openciv.game.research.type.MetalCastingTech;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.game.research.type.PhilosophyTech;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.research.type.SailingTech;
import me.rhin.openciv.game.research.type.TrappingTech;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.research.type.WritingTech;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.PickResearchListener;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;

public class ResearchTree implements PickResearchListener, CompleteResearchListener {

	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;
	private Technology researchingTech;
	private int techIDIndex;

	public ResearchTree() {
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
		technologies.put(HorsebackRridingTech.class, new HorsebackRridingTech(this));
		technologies.put(MathematicsTech.class, new MathematicsTech(this));
		technologies.put(ConstructionTech.class, new ConstructionTech(this));
		technologies.put(IronWorkingTech.class, new IronWorkingTech(this));
		technologies.put(CurrencyTech.class, new CurrencyTech(this));
		technologies.put(EngineeringTech.class, new EngineeringTech(this));
		technologies.put(MetalCastingTech.class, new MetalCastingTech(this));

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
		researchingTech = null;
	}

	@Override
	public void onPickResearch(Technology tech) {
		researchingTech = tech;
	}

	public boolean isResearching() {
		return researchingTech != null;
	}

	public int getCurrentTechIDIndex() {
		return techIDIndex++;
	}
}
