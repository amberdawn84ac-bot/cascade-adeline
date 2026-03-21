/**
 * Seed State Standards — Oklahoma Academic Standards (OAS) + Common Core (CCSS)
 *
 * Comprehensive K-12 standards covering ELA, Math, Science, Social Studies,
 * and Practical Arts (for real-life activity matching like baking, building, gardening).
 *
 * Run with: npx tsx prisma/seed-standards.ts
 */

import prisma from '../src/lib/db';

type StandardRow = { code: string; jurisdiction: string; subject: string; grade: string; statement: string };

const MATH_STANDARDS: StandardRow[] = [
  // Kindergarten
  { code: 'OK.MATH.K.N.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Count to 100 by ones and by tens.' },
  { code: 'OK.MATH.K.N.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Count forward beginning from a given number within the known sequence.' },
  { code: 'OK.MATH.K.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Represent addition and subtraction with objects, fingers, and drawings up to 10.' },
  { code: 'OK.MATH.K.OA.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Solve addition and subtraction word problems and add/subtract within 10.' },
  { code: 'OK.MATH.K.MD.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Describe measurable attributes (length, weight) of objects and compare two objects.' },
  { code: 'OK.MATH.K.G.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: 'K', statement: 'Describe and name shapes (squares, circles, triangles, rectangles, hexagons) in the environment.' },
  // Grade 1
  { code: 'OK.MATH.1.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, and comparing.' },
  { code: 'OK.MATH.1.NBT.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Count to 120, starting at any number less than 120.' },
  { code: 'OK.MATH.1.NBT.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Understand that the two digits of a two-digit number represent amounts of tens and ones.' },
  { code: 'OK.MATH.1.MD.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Order three objects by length and compare the lengths of two objects indirectly.' },
  { code: 'OK.MATH.1.MD.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '1', statement: 'Tell and write time in hours and half-hours using analog and digital clocks.' },
  // Grade 2
  { code: 'OK.MATH.2.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Use addition and subtraction within 100 to solve one- and two-step word problems.' },
  { code: 'OK.MATH.2.OA.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Fluently add and subtract within 20 using mental strategies.' },
  { code: 'OK.MATH.2.NBT.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones.' },
  { code: 'OK.MATH.2.MD.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Measure the length of an object using appropriate tools (rulers, meter sticks).' },
  { code: 'OK.MATH.2.MD.10', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '2', statement: 'Draw a picture graph and a bar graph to represent data with up to four categories.' },
  // Grade 3
  { code: 'OK.MATH.3.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Interpret products of whole numbers as the total number of objects in groups.' },
  { code: 'OK.MATH.3.OA.7', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Fluently multiply and divide within 100 using strategies such as the relationship between multiplication and division.' },
  { code: 'OK.MATH.3.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.' },
  { code: 'OK.MATH.3.MD.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Measure and estimate liquid volumes and masses of objects using grams, kilograms, and liters.' },
  { code: 'OK.MATH.3.MD.5', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Recognize area as an attribute of plane figures and understand concepts of area measurement.' },
  { code: 'OK.MATH.3.G.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '3', statement: 'Understand that shapes in different categories may share attributes; partition shapes into equal areas.' },
  // Grade 4
  { code: 'OK.MATH.4.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Interpret a multiplication equation as a comparison and represent verbal statements of multiplicative comparisons.' },
  { code: 'OK.MATH.4.OA.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Solve multi-step word problems posed with whole numbers using the four operations.' },
  { code: 'OK.MATH.4.NBT.5', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Multiply a whole number of up to four digits by a one-digit whole number.' },
  { code: 'OK.MATH.4.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b) by using visual models.' },
  { code: 'OK.MATH.4.MD.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Apply the area and perimeter formulas for rectangles in real-world and mathematical problems.' },
  { code: 'OK.MATH.4.G.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '4', statement: 'Draw points, lines, line segments, rays, angles (right, acute, obtuse) and identify these in two-dimensional figures.' },
  // Grade 5
  { code: 'OK.MATH.5.OA.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Use parentheses, brackets, or braces in numerical expressions and evaluate expressions with these symbols.' },
  { code: 'OK.MATH.5.NBT.7', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Add, subtract, multiply, and divide decimals to hundredths using concrete models.' },
  { code: 'OK.MATH.5.NF.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Add and subtract fractions with unlike denominators by replacing given fractions with equivalent fractions.' },
  { code: 'OK.MATH.5.NF.4', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction.' },
  { code: 'OK.MATH.5.MD.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Convert among different-sized standard measurement units within a given measurement system.' },
  { code: 'OK.MATH.5.MD.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Recognize volume as an attribute of solid figures and understand concepts of volume measurement.' },
  { code: 'OK.MATH.5.G.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '5', statement: 'Use a pair of perpendicular number lines (axes) to define a coordinate system and graph points.' },
  // Grade 6
  { code: 'OK.MATH.6.RP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.' },
  { code: 'OK.MATH.6.RP.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Use ratio and rate reasoning to solve real-world and mathematical problems including unit rates and percentages.' },
  { code: 'OK.MATH.6.NS.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Interpret and compute quotients of fractions and solve word problems involving division of fractions.' },
  { code: 'OK.MATH.6.NS.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Fluently add, subtract, multiply, and divide multi-digit decimals.' },
  { code: 'OK.MATH.6.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Write and evaluate numerical expressions involving whole-number exponents.' },
  { code: 'OK.MATH.6.EE.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Write, read, and evaluate expressions in which letters stand for numbers.' },
  { code: 'OK.MATH.6.G.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '6', statement: 'Find the area of right triangles, other triangles, special quadrilaterals, and polygons.' },
  // Grade 7
  { code: 'OK.MATH.7.RP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Compute unit rates associated with ratios of fractions, including ratios of lengths, areas, and quantities.' },
  { code: 'OK.MATH.7.RP.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Recognize and represent proportional relationships between quantities.' },
  { code: 'OK.MATH.7.NS.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers.' },
  { code: 'OK.MATH.7.NS.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Apply and extend previous understandings of multiplication and division of fractions to multiply and divide rational numbers.' },
  { code: 'OK.MATH.7.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Apply properties of operations to add, subtract, factor, and expand linear expressions with rational coefficients.' },
  { code: 'OK.MATH.7.G.4', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Solve real-world and mathematical problems involving area, volume, and surface area of two- and three-dimensional objects.' },
  { code: 'OK.MATH.7.SP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '7', statement: 'Understand that statistics can be used to gain information about a population by examining a sample.' },
  // Grade 8
  { code: 'OK.MATH.8.NS.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Know that numbers that are not rational are called irrational and approximate them by rational numbers.' },
  { code: 'OK.MATH.8.EE.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Know and apply the properties of integer exponents to generate equivalent numerical expressions.' },
  { code: 'OK.MATH.8.EE.7', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Solve linear equations in one variable with rational number coefficients.' },
  { code: 'OK.MATH.8.F.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Understand that a function is a rule that assigns to each input exactly one output; graph functions.' },
  { code: 'OK.MATH.8.F.3', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Interpret the equation y = mx + b as defining a linear function whose graph is a straight line.' },
  { code: 'OK.MATH.8.G.5', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Use informal arguments to establish facts about angles created when parallel lines are cut by a transversal.' },
  { code: 'OK.MATH.8.SP.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '8', statement: 'Construct and interpret scatter plots for bivariate measurement data to investigate patterns of association.' },
  // High School
  { code: 'OK.MATH.A1.A.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '9-10', statement: 'Create equations and inequalities in one variable and use them to solve problems.' },
  { code: 'OK.MATH.A1.F.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '9-10', statement: 'Understand that a function from one set to another assigns exactly one element of the range to each domain element.' },
  { code: 'OK.MATH.G.GT.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '9-10', statement: 'Prove geometric theorems about lines, angles, triangles, and parallelograms.' },
  { code: 'OK.MATH.G.GT.2', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '9-10', statement: 'Understand congruence and similarity using physical models, transparencies, or geometry software.' },
  { code: 'OK.MATH.A2.A.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '11-12', statement: 'Extend polynomial arithmetic and use it to model real-world phenomena.' },
  { code: 'OK.MATH.A2.F.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '11-12', statement: 'Analyze functions using different representations including graphs, tables, and equations.' },
  { code: 'OK.MATH.STATS.1', jurisdiction: 'Oklahoma', subject: 'Mathematics', grade: '11-12', statement: 'Summarize, represent, and interpret data on a single count or measurement variable.' },
];

const ELA_STANDARDS: StandardRow[] = [
  // Kindergarten
  { code: 'OK.ELA.K.RF.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'Demonstrate understanding of the organization and basic features of print.' },
  { code: 'OK.ELA.K.RF.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'Demonstrate understanding of spoken words, syllables, and sounds (phonological awareness).' },
  { code: 'OK.ELA.K.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'With prompting and support, ask and answer questions about key details in a text.' },
  { code: 'OK.ELA.K.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'Use a combination of drawing, dictating, and writing to compose opinion pieces.' },
  { code: 'OK.ELA.K.SL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: 'K', statement: 'Participate in collaborative conversations with diverse partners about kindergarten topics.' },
  // Grade 1
  { code: 'OK.ELA.1.RF.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Know and apply grade-level phonics and word analysis skills in decoding words.' },
  { code: 'OK.ELA.1.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Ask and answer questions about key details in a text.' },
  { code: 'OK.ELA.1.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Ask and answer questions about key details in an informational text.' },
  { code: 'OK.ELA.1.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Write opinion pieces with a topic, state an opinion, supply a reason, and provide closure.' },
  { code: 'OK.ELA.1.SL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '1', statement: 'Participate in collaborative conversations with diverse partners following rules for discussion.' },
  // Grade 2
  { code: 'OK.ELA.2.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Ask and answer such questions as who, what, where, when, why, and how to demonstrate understanding of a story.' },
  { code: 'OK.ELA.2.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Ask and answer questions about key details in an informational text.' },
  { code: 'OK.ELA.2.W.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Write informative/explanatory texts introducing a topic, supplying facts, and providing a conclusion.' },
  { code: 'OK.ELA.2.L.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Demonstrate command of the conventions of standard English grammar and usage in writing or speaking.' },
  { code: 'OK.ELA.2.SL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '2', statement: 'Participate in collaborative conversations with diverse partners about grade 2 topics.' },
  // Grade 3
  { code: 'OK.ELA.3.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text.' },
  { code: 'OK.ELA.3.RL.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Describe characters in a story and explain how their actions contribute to the sequence of events.' },
  { code: 'OK.ELA.3.RI.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Determine the main idea of a text; recount the key details and explain how they support the main idea.' },
  { code: 'OK.ELA.3.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Write opinion pieces on topics or texts, supporting a point of view with reasons and organized structure.' },
  { code: 'OK.ELA.3.W.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Write narratives to develop real or imagined experiences using effective technique and sequence.' },
  { code: 'OK.ELA.3.L.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '3', statement: 'Demonstrate command of the conventions of standard English capitalization, punctuation, and spelling.' },
  // Grade 4
  { code: 'OK.ELA.4.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Refer to details and examples in a text when explaining what the text says explicitly.' },
  { code: 'OK.ELA.4.RL.6', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Compare and contrast the point of view from which different stories are narrated.' },
  { code: 'OK.ELA.4.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences.' },
  { code: 'OK.ELA.4.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Write opinion pieces on topics or texts, supporting a point of view with reasons and information.' },
  { code: 'OK.ELA.4.W.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Write informative/explanatory texts to examine a topic and convey ideas and information clearly.' },
  { code: 'OK.ELA.4.L.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '4', statement: 'Demonstrate command of conventions of standard English grammar and usage when writing or speaking.' },
  // Grade 5
  { code: 'OK.ELA.5.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Quote accurately from a text when explaining what the text says explicitly and when drawing inferences.' },
  { code: 'OK.ELA.5.RI.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Determine two or more main ideas of a text and explain how they are supported by key details.' },
  { code: 'OK.ELA.5.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Write opinion pieces on topics or texts, supporting a point of view with logically ordered reasons.' },
  { code: 'OK.ELA.5.W.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Write narratives to develop real or imagined experiences using effective technique and descriptive details.' },
  { code: 'OK.ELA.5.L.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '5', statement: 'Explain the function of conjunctions, prepositions, and interjections in general and their role in sentences.' },
  // Grade 6
  { code: 'OK.ELA.6.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '6', statement: 'Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn.' },
  { code: 'OK.ELA.6.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '6', statement: 'Cite textual evidence to support analysis of what an informational text says explicitly and inferentially.' },
  { code: 'OK.ELA.6.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '6', statement: 'Write arguments to support claims with clear reasons and relevant evidence.' },
  { code: 'OK.ELA.6.W.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '6', statement: 'Write informative/explanatory texts to examine a topic and convey ideas through effective selection and analysis.' },
  { code: 'OK.ELA.6.W.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '6', statement: 'Write narratives to develop real or imagined experiences using effective technique and descriptive details.' },
  // Grade 7
  { code: 'OK.ELA.7.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '7', statement: 'Cite several pieces of textual evidence to support analysis of what the text says explicitly and inferentially.' },
  { code: 'OK.ELA.7.RI.2', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '7', statement: 'Determine two or more central ideas in a text and analyze their development over the course of the text.' },
  { code: 'OK.ELA.7.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '7', statement: 'Write arguments to support claims with clear reasons and relevant evidence from accurate sources.' },
  { code: 'OK.ELA.7.W.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '7', statement: 'Write narratives to develop real or imagined experiences with effective technique and sensory details.' },
  { code: 'OK.ELA.7.SL.4', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '7', statement: 'Present claims and findings, emphasizing salient points, using appropriate facts and details.' },
  // Grade 8
  { code: 'OK.ELA.8.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '8', statement: 'Cite the textual evidence that most strongly supports an analysis of what the text says explicitly and inferentially.' },
  { code: 'OK.ELA.8.RI.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '8', statement: 'Cite the textual evidence that most strongly supports an analysis of an informational text.' },
  { code: 'OK.ELA.8.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '8', statement: 'Write arguments to support claims with clear reasons and relevant evidence, acknowledging counterclaims.' },
  { code: 'OK.ELA.8.L.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '8', statement: 'Use knowledge of language and its conventions when writing, speaking, reading, or listening.' },
  { code: 'OK.ELA.8.SL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '8', statement: 'Engage effectively in a range of collaborative discussions with diverse partners on grade 8 topics.' },
  // High School
  { code: 'OK.ELA.9.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '9-10', statement: 'Cite strong and thorough textual evidence to support analysis of what the text says explicitly and inferentially.' },
  { code: 'OK.ELA.9.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '9-10', statement: 'Write arguments to support claims in an analysis of substantive topics or texts using valid reasoning.' },
  { code: 'OK.ELA.9.W.3', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '9-10', statement: 'Write narratives to develop real or imagined experiences using effective technique and well-chosen details.' },
  { code: 'OK.ELA.11.RL.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '11-12', statement: 'Cite strong and thorough textual evidence to support analysis, including determining where the text leaves matters uncertain.' },
  { code: 'OK.ELA.11.W.1', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '11-12', statement: 'Write arguments to investigate topics or texts, establishing significance and acknowledging limitations.' },
  { code: 'OK.ELA.11.RI.7', jurisdiction: 'Oklahoma', subject: 'English Language Arts', grade: '11-12', statement: 'Integrate and evaluate multiple sources of information presented in different media to address a question.' },
];

const SCIENCE_STANDARDS: StandardRow[] = [
  { code: 'OK.SCI.K.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: 'K', statement: 'Plan and conduct an investigation to compare the effects of different strengths of pushes and pulls on objects.' },
  { code: 'OK.SCI.K.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: 'K', statement: 'Use observations to describe patterns of what plants and animals (including humans) need to survive.' },
  { code: 'OK.SCI.K.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: 'K', statement: 'Use and share observations of local weather conditions to describe patterns over time.' },
  { code: 'OK.SCI.1.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '1', statement: 'Plan and conduct investigations to provide evidence that vibrating materials can make sound.' },
  { code: 'OK.SCI.1.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '1', statement: 'Use materials to design a solution to a human problem by mimicking how plants and/or animals use their external parts.' },
  { code: 'OK.SCI.2.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '2', statement: 'Plan and conduct an investigation to describe and classify different kinds of materials by their observable properties.' },
  { code: 'OK.SCI.2.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '2', statement: 'Plan and conduct an investigation to determine if plants need sunlight and water to grow.' },
  { code: 'OK.SCI.2.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '2', statement: 'Compare multiple solutions designed to slow or prevent wind or water from changing the shape of land.' },
  { code: 'OK.SCI.3.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '3', statement: 'Plan and conduct an investigation to provide evidence of the effects of balanced and unbalanced forces on motion.' },
  { code: 'OK.SCI.3.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '3', statement: 'Analyze and interpret data to provide evidence that plants and animals have traits inherited from parents.' },
  { code: 'OK.SCI.3.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '3', statement: 'Represent data in tables and graphical displays to describe typical weather conditions expected during a particular season.' },
  { code: 'OK.SCI.4.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '4', statement: 'Use evidence to construct an explanation relating the speed of an object to the energy of that object.' },
  { code: 'OK.SCI.4.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '4', statement: 'Construct an explanation of how internal and external structures support the survival, growth, and reproduction of organisms.' },
  { code: 'OK.SCI.4.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '4', statement: 'Identify evidence from patterns in rock formations and fossils in rock layers to support explanation of landscape changes.' },
  { code: 'OK.SCI.5.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '5', statement: 'Develop a model to describe that matter is made of particles too small to be seen but can be measured by their mass.' },
  { code: 'OK.SCI.5.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '5', statement: 'Support an argument that plants get the materials they need for growth chiefly from air and water.' },
  { code: 'OK.SCI.5.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '5', statement: 'Support an argument that differences in the apparent brightness of the sun compared to other stars is due to their distances from Earth.' },
  { code: 'OK.SCI.6.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '6', statement: 'Develop and use a model to describe how the total number of atoms does not change in a chemical reaction.' },
  { code: 'OK.SCI.6.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '6', statement: 'Develop a model to describe how food is rearranged through chemical reactions forming new molecules.' },
  { code: 'OK.SCI.6.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '6', statement: 'Develop a model to describe the cycling of Earth\'s materials and the flow of energy that drives this process.' },
  { code: 'OK.SCI.7.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '7', statement: 'Develop models to describe the atomic composition of simple molecules and extended structures.' },
  { code: 'OK.SCI.7.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '7', statement: 'Develop a model to describe the cycling of matter and flow of energy among living and nonliving parts of an ecosystem.' },
  { code: 'OK.SCI.7.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '7', statement: 'Construct a scientific explanation based on evidence from rock strata for how the geologic time scale is used to organize Earth\'s history.' },
  { code: 'OK.SCI.8.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '8', statement: 'Develop and use a model to describe how the total number of atoms in a nuclear process is conserved.' },
  { code: 'OK.SCI.8.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '8', statement: 'Analyze and interpret data for patterns in the fossil record that document the existence, diversity, and extinction of life.' },
  { code: 'OK.SCI.8.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '8', statement: 'Analyze and interpret data on the distribution of fossils and rocks, continental shapes, and seafloor structures to provide evidence of plate tectonics.' },
  { code: 'OK.SCI.HS.PS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '9-10', statement: 'Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms.' },
  { code: 'OK.SCI.HS.LS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '9-10', statement: 'Construct an explanation based on evidence that the process of evolution primarily results from natural selection.' },
  { code: 'OK.SCI.HS.ESS.1', jurisdiction: 'Oklahoma', subject: 'Science', grade: '9-10', statement: 'Construct an explanation of the Big Bang Theory based on astronomical evidence for the origin of the universe.' },
  { code: 'OK.SCI.HS.PS.2', jurisdiction: 'Oklahoma', subject: 'Science', grade: '11-12', statement: 'Analyze a major global challenge to specify qualitative and quantitative criteria and constraints for solutions.' },
  { code: 'OK.SCI.HS.LS.2', jurisdiction: 'Oklahoma', subject: 'Science', grade: '11-12', statement: 'Evaluate the evidence for the role of group behavior on individual and species\' chances to survive and reproduce.' },
];

const SOCIAL_STUDIES_STANDARDS: StandardRow[] = [
  { code: 'OK.SS.K.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: 'K', statement: 'Demonstrate an awareness of the student\'s own family history and its connection to community.' },
  { code: 'OK.SS.K.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: 'K', statement: 'Identify relative location and the differences between land and water on maps and globes.' },
  { code: 'OK.SS.1.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '1', statement: 'Describe the lives of people from long ago and how their lives were similar to and different from today.' },
  { code: 'OK.SS.1.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '1', statement: 'Construct and interpret maps of the local community to identify natural and human features.' },
  { code: 'OK.SS.2.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '2', statement: 'Describe contributions of people who have worked to improve life in communities past and present.' },
  { code: 'OK.SS.2.C.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '2', statement: 'Explain the basic purpose of rules and laws in the home, school, and community.' },
  { code: 'OK.SS.3.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '3', statement: 'Describe the significance of national holidays and the heroism and achievements of the people associated with them.' },
  { code: 'OK.SS.3.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '3', statement: 'Use map features to locate and describe major bodies of water, mountains, and natural boundaries of communities.' },
  { code: 'OK.SS.3.E.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '3', statement: 'Describe how the availability of resources impacts where communities develop and how they change over time.' },
  { code: 'OK.SS.4.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '4', statement: 'Describe the history of Oklahoma including the Five Civilized Tribes and the Land Run of 1889.' },
  { code: 'OK.SS.4.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '4', statement: 'Describe the physical features and regions of the United States and their relationship to historical development.' },
  { code: 'OK.SS.4.E.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '4', statement: 'Explain economic concepts including supply, demand, trade, and how they shaped Oklahoma history.' },
  { code: 'OK.SS.5.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '5', statement: 'Describe the causes and effects of the American Revolution including key figures, battles, and documents.' },
  { code: 'OK.SS.5.H.2', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '5', statement: 'Describe the Constitutional Convention, key founders, and the principles of the U.S. Constitution.' },
  { code: 'OK.SS.5.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '5', statement: 'Locate and describe the geographic features of the United States and their relationship to early American history.' },
  { code: 'OK.SS.6.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '6', statement: 'Examine the causes and effects of the development of early civilizations in Mesopotamia, Egypt, Greece, and Rome.' },
  { code: 'OK.SS.6.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '6', statement: 'Describe the physical and cultural geography of the ancient world and how it shaped early civilizations.' },
  { code: 'OK.SS.7.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '7', statement: 'Analyze the causes and effects of major world history events from the Middle Ages through the Enlightenment.' },
  { code: 'OK.SS.7.G.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '7', statement: 'Use maps, globes, and geospatial technologies to locate and describe physical and human features of places.' },
  { code: 'OK.SS.8.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '8', statement: 'Analyze causes and effects of major U.S. historical events from colonization through Reconstruction.' },
  { code: 'OK.SS.8.C.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '8', statement: 'Analyze the foundations, structures, and functions of the U.S. government as defined in the Constitution.' },
  { code: 'OK.SS.8.E.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '8', statement: 'Analyze the economic development of the United States from colonial times through the Industrial Revolution.' },
  { code: 'OK.SS.US.H.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '9-10', statement: 'Analyze causes and effects of major U.S. history events from Reconstruction through the 21st century.' },
  { code: 'OK.SS.WH.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '9-10', statement: 'Analyze causes and effects of major world history events including industrialization, colonialism, and global conflicts.' },
  { code: 'OK.SS.GOV.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '11-12', statement: 'Analyze the foundations, structures, and functions of the U.S. government and the democratic process.' },
  { code: 'OK.SS.ECON.1', jurisdiction: 'Oklahoma', subject: 'Social Studies', grade: '11-12', statement: 'Apply economic concepts including supply and demand, market structures, and monetary policy to current events.' },
];

// Practical Arts standards — essential for matching real-life activities like baking, building, gardening
const PRACTICAL_ARTS_STANDARDS: StandardRow[] = [
  { code: 'OK.FCS.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Apply basic nutrition knowledge by identifying food groups and preparing simple recipes.' },
  { code: 'OK.FCS.K5.2', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Demonstrate food safety and sanitation practices including hand washing and proper food storage.' },
  { code: 'OK.FCS.K5.3', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Follow sequential steps in a recipe, demonstrating measurement and basic cooking skills.' },
  { code: 'OK.FCS.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply principles of nutrition to plan and prepare balanced meals using a variety of cooking techniques.' },
  { code: 'OK.FCS.68.2', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Demonstrate understanding of chemical reactions in food preparation (leavening agents, fermentation, emulsification).' },
  { code: 'OK.FCS.HS.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '9-12', statement: 'Analyze nutritional content of foods and create meal plans meeting dietary guidelines for health and wellness.' },
  { code: 'OK.CTE.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Use basic tools safely and correctly to complete hands-on construction and craft projects.' },
  { code: 'OK.CTE.K5.2', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Apply measurement skills to design and build simple structures using appropriate materials.' },
  { code: 'OK.CTE.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply engineering design process: identify a problem, design a solution, build a prototype, and evaluate results.' },
  { code: 'OK.CTE.68.2', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Use tools, materials, and processes to construct projects that demonstrate understanding of structural integrity.' },
  { code: 'OK.CTE.HS.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '9-12', statement: 'Apply advanced technical skills in a career and technical education pathway demonstrating workplace readiness.' },
  { code: 'OK.HORT.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Plant, tend, and observe the growth of seeds and plants, recording changes over time.' },
  { code: 'OK.HORT.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply principles of soil science, plant biology, and water management in a garden or agricultural setting.' },
  { code: 'OK.HEALTH.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Identify and practice personal health behaviors that promote physical, mental, and social well-being.' },
  { code: 'OK.HEALTH.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Analyze how personal health choices affect short-term and long-term well-being.' },
  { code: 'OK.PE.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Demonstrate competency in fundamental movement skills including locomotor, non-locomotor, and manipulative skills.' },
  { code: 'OK.PE.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply movement concepts and principles to the learning and development of motor skills in a variety of activities.' },
  { code: 'OK.ART.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Create artwork using a variety of materials, tools, and processes to express ideas and emotions.' },
  { code: 'OK.ART.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply the elements of art and principles of design to create original artwork with intentional artistic choices.' },
  { code: 'OK.MUS.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Sing or play instruments with accuracy and expression, and respond to music through movement.' },
  { code: 'OK.MUS.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Perform music with technical accuracy and expressive quality in individual and ensemble settings.' },
  { code: 'OK.TECH.K5.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: 'K-5', statement: 'Use technology tools responsibly to create, communicate, and collaborate on projects.' },
  { code: 'OK.TECH.68.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '6-8', statement: 'Apply computational thinking and coding concepts to solve problems and create digital projects.' },
  { code: 'OK.TECH.HS.1', jurisdiction: 'Oklahoma', subject: 'Practical Arts', grade: '9-12', statement: 'Design and implement solutions using programming, data analysis, and digital tools to address real-world problems.' },
];

const ALL_STANDARDS: StandardRow[] = [
  ...MATH_STANDARDS,
  ...ELA_STANDARDS,
  ...SCIENCE_STANDARDS,
  ...SOCIAL_STUDIES_STANDARDS,
  ...PRACTICAL_ARTS_STANDARDS,
];

async function main() {
  console.log(`🌱 Seeding ${ALL_STANDARDS.length} Oklahoma academic standards...\n`);

  let created = 0;
  let skipped = 0;

  for (const s of ALL_STANDARDS) {
    try {
      await prisma.stateStandard.upsert({
        where: {
          standardCode_jurisdiction: {
            standardCode: s.code,
            jurisdiction: s.jurisdiction,
          },
        },
        update: {
          statementText: s.statement,
          subject: s.subject,
          gradeLevel: s.grade,
        },
        create: {
          standardCode: s.code,
          jurisdiction: s.jurisdiction,
          subject: s.subject,
          gradeLevel: s.grade,
          statementText: s.statement,
        },
      });
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${s.code}`, err);
      skipped++;
    }
  }

  console.log(`\n✅ Seeded ${created} standards (${skipped} skipped)`);
  console.log('   Subjects: Mathematics, ELA, Science, Social Studies, Practical Arts');
  console.log('   Grades: K-12');
  console.log('   Jurisdiction: Oklahoma');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
