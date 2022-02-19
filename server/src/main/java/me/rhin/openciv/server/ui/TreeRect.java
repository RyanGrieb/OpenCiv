package me.rhin.openciv.server.ui;

import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics;

import javax.swing.JPanel;

public class TreeRect extends JPanel {

	private static final long serialVersionUID = 1L;
	private int x, y, width, height;
	private int fontWidth, fontHeight;
	private String text;
	private FontMetrics fontMetrics;

	public TreeRect(String text, int x, int y) {
		this.text = text;
		this.x = x;
		this.y = y;
		this.fontMetrics = getFontMetrics(new Font("Verdana", Font.PLAIN, 10));

		int totalTextWidth = 0;

		for (int i = 0; i < text.length(); i++) {
			totalTextWidth += fontMetrics.charWidth(text.charAt(i));
		}

		this.width = fontMetrics.getHeight();
		this.height = totalTextWidth;

	}

	@Override
	protected void paintComponent(Graphics g) {
		super.paintComponent(g);
		g.setFont(fontMetrics.getFont());

		g.drawString(text, x, y + fontMetrics.getAscent());
		g.drawRect(x - 5, y - 5, fontMetrics.stringWidth(text) + 10, fontMetrics.getHeight() + 10);
	}

}
