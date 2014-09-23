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

/*
 * Contributors:
 * Gaganis Giorgos - gaganis@users.sourceforge.net
 */
package net.sf.jasperreports.compilers;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import net.sf.jasperreports.engine.JRExpression;
import net.sf.jasperreports.engine.JRExpressionChunk;
import net.sf.jasperreports.engine.JRField;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JRVariable;
import net.sf.jasperreports.engine.design.JRSourceCompileTask;
import net.sf.jasperreports.engine.util.JRStringUtil;


/**
 * @author Teodor Danciu (teodord@users.sourceforge.net)
 * @version $Id$
 */
public class JRBshGenerator
{

	private static Map<Byte, String> fieldPrefixMap;
	private static Map<Byte, String> variablePrefixMap;
	private static Map<Byte, String> methodSuffixMap;
	
	
	/**
	 *
	 */
	protected final JRSourceCompileTask sourceTask;

	protected Map<String, ? extends JRParameter> parametersMap;
	protected Map<String, JRField> fieldsMap;
	protected Map<String, JRVariable> variablesMap;
	protected JRVariable[] variables;

	static
	{
		fieldPrefixMap = new HashMap<Byte, String>();
		fieldPrefixMap.put(new Byte(JRExpression.EVALUATION_OLD),       "Old");
		fieldPrefixMap.put(new Byte(JRExpression.EVALUATION_ESTIMATED), "");
		fieldPrefixMap.put(new Byte(JRExpression.EVALUATION_DEFAULT),   "");
		
		variablePrefixMap = new HashMap<Byte, String>();
		variablePrefixMap.put(new Byte(JRExpression.EVALUATION_OLD),       "Old");
		variablePrefixMap.put(new Byte(JRExpression.EVALUATION_ESTIMATED), "Estimated");
		variablePrefixMap.put(new Byte(JRExpression.EVALUATION_DEFAULT),   "");
		
		methodSuffixMap = new HashMap<Byte, String>();
		methodSuffixMap.put(new Byte(JRExpression.EVALUATION_OLD),       "Old");
		methodSuffixMap.put(new Byte(JRExpression.EVALUATION_ESTIMATED), "Estimated");
		methodSuffixMap.put(new Byte(JRExpression.EVALUATION_DEFAULT),   "");
	}
	

	protected JRBshGenerator(JRSourceCompileTask sourceTask)
	{
		this.sourceTask = sourceTask;
		
		this.parametersMap = sourceTask.getParametersMap();
		this.fieldsMap = sourceTask.getFieldsMap();
		this.variablesMap = sourceTask.getVariablesMap();
		this.variables = sourceTask.getVariables();
	}


	/**
	 *
	 */
	public static String generateScript(JRSourceCompileTask sourceTask)
	{
		JRBshGenerator generator = new JRBshGenerator(sourceTask);
		return generator.generateScript();
	}
	
	
	protected String generateScript()
	{
		StringBuffer sb = new StringBuffer();

		generateScriptStart(sb);

		generateDeclarations(sb);
		generateInitMethod(sb);
		
		sb.append("\n");
		sb.append("\n");

		List<JRExpression> expressions = sourceTask.getExpressions();
		sb.append(generateMethod(JRExpression.EVALUATION_DEFAULT, expressions));
		if (sourceTask.isOnlyDefaultEvaluation())
		{
			List<JRExpression> empty = new ArrayList<JRExpression>();
			sb.append(generateMethod(JRExpression.EVALUATION_OLD, empty));
			sb.append(generateMethod(JRExpression.EVALUATION_ESTIMATED, empty));
		}
		else
		{
			sb.append(generateMethod(JRExpression.EVALUATION_OLD, expressions));
			sb.append(generateMethod(JRExpression.EVALUATION_ESTIMATED, expressions));
		}

		generateScriptEnd(sb);

		return sb.toString();
	}


	protected final void generateScriptStart(StringBuffer sb)
	{
		/*   */
		sb.append("//\n");
		sb.append("// Generated by JasperReports - ");
		sb.append((new SimpleDateFormat()).format(new java.util.Date()));
		sb.append("\n");
		sb.append("//\n");
		sb.append("import net.sf.jasperreports.engine.*;\n");
		sb.append("import net.sf.jasperreports.engine.fill.*;\n");
		sb.append("\n");
		sb.append("import java.util.*;\n");
		sb.append("import java.math.*;\n");
		sb.append("import java.text.*;\n");
		sb.append("import java.io.*;\n");
		sb.append("import java.net.*;\n");
		sb.append("\n");
		
		/*   */
		String[] imports = sourceTask.getImports();
		if (imports != null && imports.length > 0)
		{
			for (int i = 0; i < imports.length; i++)
			{
				sb.append("import ");
				sb.append(imports[i]);
				sb.append(";\n");
			}
		}

		/*   */
		sb.append("\n");
		sb.append("\n");
		sb.append("createBshEvaluator()\n");
		sb.append("{\n"); 
		sb.append("\n");
		sb.append("\n");
		sb.append("    JREvaluator evaluator = null;\n");
		sb.append("\n");
	}


	protected final void generateDeclarations(StringBuffer sb)
	{
		/*   */
		if (parametersMap != null && parametersMap.size() > 0)
		{
			Collection<String> parameterNames = parametersMap.keySet();
			for (Iterator<String> it = parameterNames.iterator(); it.hasNext();)
			{
				sb.append("    JRFillParameter parameter_");
				sb.append(JRStringUtil.getJavaIdentifier(it.next()));
				sb.append(" = null;\n");
			}
		}
		
		/*   */
		sb.append("\n");

		/*   */
		if (fieldsMap != null && fieldsMap.size() > 0)
		{
			Collection<String> fieldNames = fieldsMap.keySet();
			for (Iterator<String> it = fieldNames.iterator(); it.hasNext();)
			{
				sb.append("    JRFillField field_");
				sb.append(JRStringUtil.getJavaIdentifier(it.next()));
				sb.append(" = null;\n");
			}
		}
		
		/*   */
		sb.append("\n");

		/*   */
		if (variables != null && variables.length > 0)
		{
			for (int i = 0; i < variables.length; i++)
			{
				sb.append("    JRFillVariable variable_");
				sb.append(JRStringUtil.getJavaIdentifier(variables[i].getName()));
				sb.append(" = null;\n");
			}
		}
	}


	protected final void generateInitMethod(StringBuffer sb)
	{
		/*   */
		sb.append("\n");
		sb.append("\n");
		sb.append("    init(\n"); 
		sb.append("        JREvaluator evaluator,\n"); 
		sb.append("        Map parsm,\n"); 
		sb.append("        Map fldsm,\n"); 
		sb.append("        Map varsm\n");
		sb.append("        )\n");
		sb.append("    {\n");
		sb.append("        super.evaluator = evaluator;\n");
		sb.append("\n");

		/*   */
		if (parametersMap != null && parametersMap.size() > 0)
		{
			Collection<String> parameterNames = parametersMap.keySet();
			String parameterName = null;
			for (Iterator<String> it = parameterNames.iterator(); it.hasNext();)
			{
				parameterName = it.next();
				sb.append("        super.parameter_");
				sb.append(JRStringUtil.getJavaIdentifier(parameterName));
				sb.append(" = (JRFillParameter)parsm.get(\"");
				sb.append(JRStringUtil.escapeJavaStringLiteral(parameterName));
				sb.append("\");\n");
			}
		}
		
		/*   */
		sb.append("\n");

		/*   */
		if (fieldsMap != null && fieldsMap.size() > 0)
		{
			Collection<String> fieldNames = fieldsMap.keySet();
			String fieldName = null;
			for (Iterator<String> it = fieldNames.iterator(); it.hasNext();)
			{
				fieldName = it.next();
				sb.append("        super.field_");
				sb.append(JRStringUtil.getJavaIdentifier(fieldName));
				sb.append(" = (JRFillField)fldsm.get(\"");
				sb.append(JRStringUtil.escapeJavaStringLiteral(fieldName));
				sb.append("\");\n");
			}
		}
		
		/*   */
		sb.append("\n");

		/*   */
		if (variables != null && variables.length > 0)
		{
			String variableName = null;
			for (int i = 0; i < variables.length; i++)
			{
				variableName = variables[i].getName();
				sb.append("        super.variable_");
				sb.append(JRStringUtil.getJavaIdentifier(variableName));
				sb.append(" = (JRFillVariable)varsm.get(\"");
				sb.append(JRStringUtil.escapeJavaStringLiteral(variableName));
				sb.append("\");\n");
			}
		}

		/*   */
		sb.append("    }\n");
	}


	protected void generateScriptEnd(StringBuffer sb)
	{
		sb.append("\n"); 
		sb.append("    str(String key)\n");
		sb.append("    {\n");
		sb.append("        return super.evaluator.str(key);\n");
		sb.append("    }\n");
		sb.append("\n"); 
		sb.append("    msg(String pattern, Object arg0)\n");
		sb.append("    {\n");
		sb.append("        return super.evaluator.msg(pattern, arg0);\n");
		sb.append("    }\n");
		sb.append("\n"); 
		sb.append("    msg(String pattern, Object arg0, Object arg1)\n");
		sb.append("    {\n");
		sb.append("        return super.evaluator.msg(pattern, arg0, arg1);\n");
		sb.append("    }\n");
		sb.append("\n"); 
		sb.append("    msg(String pattern, Object arg0, Object arg1, Object arg2)\n");
		sb.append("    {\n");
		sb.append("        return super.evaluator.msg(pattern, arg0, arg1, arg2);\n");
		sb.append("    }\n");
		sb.append("\n"); 
		sb.append("    msg(String pattern, Object[] args)\n");
		sb.append("    {\n");
		sb.append("        return super.evaluator.msg(pattern, args);\n");
		sb.append("    }\n");
		sb.append("\n"); 
		sb.append("    return this;\n");
		sb.append("}\n");
	}		


	/**
	 *
	 */
	protected final String generateMethod(byte evaluationType, List<JRExpression> expressionsList)
	{
		StringBuffer sb = new StringBuffer();

		/*   */
		sb.append("    Object evaluate");
		sb.append(methodSuffixMap.get(new Byte(evaluationType)));
		sb.append("(int id)\n");
		sb.append("    {\n");
		sb.append("        Object value = null;\n");
		sb.append("\n");
		sb.append("        switch (id)\n");
		sb.append("        {\n");

		if (expressionsList != null && !expressionsList.isEmpty())
		{
			JRExpression expression = null;
			for (Iterator<JRExpression> it = expressionsList.iterator(); it.hasNext();)
			{
				expression = it.next();
				
				sb.append("            case ");
				sb.append(sourceTask.getExpressionId(expression));
				sb.append(" :\n");
				sb.append("            {\n");
				sb.append("                value = ");
				sb.append(this.generateExpression(expression, evaluationType));
				sb.append(";\n");
				sb.append("                break;\n");
				sb.append("            }\n");
			}
		}

		/*   */
		sb.append("           default :\n");
		sb.append("           {\n");
		sb.append("           }\n");
		sb.append("        }\n");
		sb.append("        \n");
		sb.append("        return value;\n");
		sb.append("    }\n");
		sb.append("\n");
		sb.append("\n");
		
		return sb.toString();
	}


	/**
	 *
	 */
	private String generateExpression(
		JRExpression expression,
		byte evaluationType
		)
	{
		JRParameter jrParameter = null;
		JRField jrField = null;
		JRVariable jrVariable = null;

		StringBuffer sbuffer = new StringBuffer();

		JRExpressionChunk[] chunks = expression.getChunks();
		JRExpressionChunk chunk = null;
		String chunkText = null;
		if (chunks != null && chunks.length > 0)
		{
			for(int i = 0; i < chunks.length; i++)
			{
				chunk = chunks[i];

				chunkText = chunk.getText();
				if (chunkText == null)
				{
					chunkText = "";
				}
				
				switch (chunk.getType())
				{
					case JRExpressionChunk.TYPE_TEXT :
					{
						sbuffer.append(chunkText);
						break;
					}
					case JRExpressionChunk.TYPE_PARAMETER :
					{
						jrParameter = parametersMap.get(chunkText);
	
						sbuffer.append("((");
						sbuffer.append(jrParameter.getValueClassName());
						sbuffer.append(")super.parameter_");
						sbuffer.append(JRStringUtil.getJavaIdentifier(chunkText));
						sbuffer.append(".getValue())");
	
						break;
					}
					case JRExpressionChunk.TYPE_FIELD :
					{
						jrField = fieldsMap.get(chunkText);
	
						sbuffer.append("((");
						sbuffer.append(jrField.getValueClassName());
						sbuffer.append(")super.field_");
						sbuffer.append(JRStringUtil.getJavaIdentifier(chunkText));
						sbuffer.append(".get");
						sbuffer.append(fieldPrefixMap.get(new Byte(evaluationType)));
						sbuffer.append("Value())");
	
						break;
					}
					case JRExpressionChunk.TYPE_VARIABLE :
					{
						jrVariable = variablesMap.get(chunkText);
	
						sbuffer.append("((");
						sbuffer.append(jrVariable.getValueClassName());
						sbuffer.append(")super.variable_");
						sbuffer.append(JRStringUtil.getJavaIdentifier(chunkText));
						sbuffer.append(".get");
						sbuffer.append(variablePrefixMap.get(new Byte(evaluationType)));
						sbuffer.append("Value())");
	
						break;
					}
					case JRExpressionChunk.TYPE_RESOURCE :
					{
						jrParameter = parametersMap.get(chunkText);
	
						sbuffer.append("super.evaluator.str(\"");
						sbuffer.append(chunkText);
						sbuffer.append("\")");
	
						break;
					}
				}
			}
		}
		
		if (sbuffer.length() == 0)
		{
			sbuffer.append("null");
		}

		return sbuffer.toString();
	}
}
