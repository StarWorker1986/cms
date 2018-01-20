package org.starworker.cms.admin;

import java.time.LocalDate;
import java.time.Period;

public class HotSpot {
	public static void main(String[] args) {
		LocalDate date1 = LocalDate.of(2017, 9, 30);
		LocalDate date2 = LocalDate.of(2018, 10, 31);
		
		Period period = date1.until(date2);
		
		System.err.println(period.getYears() + ":" + period.getMonths() + ":" + period.getDays());
	}
}
