package me.rhin.openciv.shared.util;

import java.util.ArrayList;
import java.util.Random;

import com.badlogic.gdx.graphics.Color;

public class ColorHelper {

	private ArrayList<Color> availableColors;

	public ColorHelper() {
		this.availableColors = new ArrayList<>();

		availableColors.add(Color.BLACK);
		availableColors.add(Color.BROWN);
		availableColors.add(Color.RED);
		availableColors.add(Color.ORANGE);
		availableColors.add(Color.YELLOW);
		availableColors.add(Color.GREEN);
		availableColors.add(Color.BLUE);
		availableColors.add(Color.VIOLET);
		availableColors.add(Color.GRAY);
		availableColors.add(Color.WHITE);
	}

	public Color getRandomColor() {
		Random rnd = new Random();

		if (availableColors.size() < 1)
			return Color.WHITE;

		int num = rnd.nextInt(availableColors.size());
		Color color = availableColors.get(num);
		availableColors.remove(num);
		return color;
	}
}
