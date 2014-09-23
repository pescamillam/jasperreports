/*
 * JasperReports - Free Java Reporting Library.
 * Copyright (C) 2001 - 2014 TIBCO Software Inc. All rights reserved.
 * http://www.jaspersoft.com
 *
 * Unless you have purchased a commercial license agreement from Jaspersoft,
 * the following license terms apply:
 *
 * This program is part of JasperReports.
 *
 * JasperReports is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * JasperReports is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with JasperReports. If not, see <http://www.gnu.org/licenses/>.
 */
package net.sf.jasperreports.data.cache;

import java.io.ObjectStreamException;
import java.io.Serializable;

import net.sf.jasperreports.engine.JRConstants;

/**
 * @author Lucian Chirita (lucianc@users.sourceforge.net)
 * @version $Id$
 */
public final class NumberToByteTransformer implements ValueTransformer, Serializable
{

	private static final long serialVersionUID = JRConstants.SERIAL_VERSION_UID;

	private static final NumberToByteTransformer INSTANCE = new NumberToByteTransformer();
	
	public static NumberToByteTransformer instance()
	{
		return INSTANCE;
	}
	
	private NumberToByteTransformer()
	{
	}

	@Override
	public Class<?> getResultType()
	{
		return Byte.class;
	}
	
	public Object get(Object value)
	{
		return ((Number) value).byteValue();
	}
	
	private Object readResolve() throws ObjectStreamException
	{
		return INSTANCE;
	}
	
}