import re
import json

# Define the OCR raw blocks for all 35 pages from the provided PDF:
PAGES_DATA = """
1. abandon (v.) = leave completely
त्याग देना
2. abate (v.) = become less intense
कम होना
3. abbreviate (v.) = shorten a word or text
संक्षिप्त करना
4. abdicate (v.) = give up a position
पद त्यागना
5. abduct (v.) = take away by force
अपहरण करना
6. aberration (n.) = departure from normal
असामान्य विचलन
7. abide (v.) = accept and follow
पालन करना
8. ability (n.) = power or skill to do
क्षमता
9. abject (adj.) = extremely miserable
अत्यंत दयनीय
10. abolish (v.) = officially end
समाप्त करना
11. abrupt (adj.) = sudden and unexpected
अचानक
12. absence (n.) = state of being away
अनुपस्थिति
13. absolute (adj.) = complete or total
पूर्ण
14. absorb (v.) = take in
सोखना; ग्रहण करना
15. abstain (v.) = choose not to do
परहेज करना
16. abstract (adj.) = existing as an idea
अमूर्त
17. absurd (adj.) = completely unreasonable
बेतुका
18. abundance (n.) = a very large quantity
प्रचुरता
19. abundant (adj.) = available in large amounts
प्रचुर
20. abuse (n.) = harmful or improper use
दुरुपयोग
21. accelerate (v.) = increase speed
तेज करना
22. accept (v.) = agree to receive
स्वीकार करना
23. accessible (adj.) = easy to reach or use
सुलभ
24. acclaim (n.) = enthusiastic public praise
प्रशंसा
25. accommodate (v.) = provide room or adjust
जगह देना; समायोजित करना
26. accompany (v.) = go along with
साथ जाना
27. accomplish (v.) = complete successfully
पूरा करना
28. accord (n.) = formal agreement
समझौता
29. accountable (adj.) = responsible for actions
जवाबदेह
30. accumulate (v.) = collect over time
संचित करना
31. accurate (adj.) = free from errors
सटीक
32. accuse (v.) = charge with wrongdoing
आरोप लगाना
33. achieve (v.) = reach a desired goal
प्राप्त करना
34. acknowledge (v.) = accept or recognise
स्वीकार करना
35. acquaint (v.) = make familiar
परिचित कराना
36. acquire (v.) = obtain or gain
हासिल करना
37. acute (adj.) = severe or intense
तीव्र
38. adapt (v.) = adjust to conditions
अनुकूल बनाना
39. adequate (adj.) = enough for a purpose
पर्याप्त
40. adhere (v.) = stick firmly to
पालन करना; चिपकना
41. adjacent (adj.) = next to something
निकटवर्ती
42. adjoin (v.) = be next to
सटा होना
43. adjourn (v.) = pause a meeting
स्थगित करना
44. adjust (v.) = change slightly to suit
समायोजित करना
45. administer (v.) = manage or carry out
प्रशासन चलाना
46. admire (v.) = respect with approval
प्रशंसा करना
47. admit (v.) = accept as true
स्वीकार करना
48. adolescent (n.) = a young teenage person
किशोर
49. adopt (v.) = take up or accept
अपनाना
50. adore (v.) = love deeply
बहुत प्यार करना
51. adverse (adj.) = harmful or unfavourable
प्रतिकूल
52. adversity (n.) = serious difficulty
विपत्ति
53. advertise (v.) = publicly promote
विज्ञापन करना
54. advice (n.) = guidance or suggestion
सलाह
55. advise (v.) = give guidance
सलाह देना
56. advocate (v.) = publicly support
समर्थन करना
57. affect (v.) = have an influence on
प्रभावित करना
58. affection (n.) = warm feeling of love
स्नेह
59. affiliate (v.) = officially connect
संबद्ध करना
60. affluent (adj.) = having much wealth
समृद्ध
61. affordable (adj.) = reasonably priced
किफायती
62. aggravate (v.) = make worse
और बिगाड़ना
63. aggregate (n.) = combined total
कुल योग
64. aggressive (adj.) = ready to attack or argue
आक्रामक
65. agile (adj.) = able to move quickly
फुर्तीला
66. agitate (v.) = make anxious or disturbed
उत्तेजित करना
67. agony (n.) = extreme pain
भीषण पीड़ा
68. agreeable (adj.) = pleasant or acceptable
सुखद; स्वीकार्य
69. agriculture (n.) = farming activity
कृषि
70. aid (n.) = help or assistance
सहायता
71. alarm (n.) = sudden fear or warning
भय; चेतावनी
72. alert (adj.) = watchful and ready
सतर्क
73. alien (adj.) = foreign or unfamiliar
विदेशी; अपरिचित
74. align (v.) = arrange in a line
सीध में लगाना
75. allege (v.) = claim without proof
आरोप लगाना
76. alleviate (v.) = make suffering less severe
राहत देना
77. allocate (v.) = assign for a purpose
आवंटित करना
78. allowance (n.) = regular amount of money
भत्ता
79. ally (n.) = supporter or partner
सहयोगी
80. alter (v.) = make different
बदलना
81. alternate (adj.) = every other one
एक छोड़कर अगला
82. alternative (n.) = another available choice
विकल्प
83. ambiguous (adj.) = having more than one meaning
अस्पष्ट; द्विअर्थी
84. ambition (n.) = strong desire to succeed
महत्त्वाकांक्षा
85. amend (v.) = change to improve
संशोधन करना
86. amiable (adj.) = friendly and pleasant
मिलनसार
87. amicable (adj.) = peaceful and friendly
सौहार्दपूर्ण
88. ample (adj.) = more than enough
भरपूर
89. amplify (v.) = increase strength or volume
बढ़ाना
90. amuse (v.) = make someone laugh
मनोरंजन करना
91. analyse (v.) = examine in detail
विश्लेषण करना
92. ancestor (n.) = a family predecessor
पूर्वज
93. ancient (adj.) = very old
प्राचीन
94. anecdote (n.) = short interesting account
छोटा रोचक किस्सा
95. anguish (n.) = deep mental suffering
गहरी वेदना
96. annual (adj.) = occurring every year
वार्षिक
97. anonymous (adj.) = with no known name
गुमनाम
98. antagonist (n.) = an opponent
विरोधी
99. anticipate (v.) = expect in advance
पहले से अनुमान लगाना
100. anxiety (n.) = worry or uneasiness
चिंता
101. apathetic (adj.) = showing no interest
उदासीन
102. apathy (n.) = lack of interest
उदासीनता
103. apologise (v.) = express regret
माफी माँगना
104. apparent (adj.) = clearly visible or seeming
प्रत्यक्ष; प्रतीत होने वाला
105. appeal (n.) = an earnest request
अपील; अनुरोध
106. appease (v.) = calm by satisfying demands
शांत करना
107. applaud (v.) = show approval by clapping
तालियाँ बजाना
108. applicable (adj.) = relevant or suitable
लागू होने योग्य
109. appoint (v.) = choose for a position
नियुक्त करना
110. appraise (v.) = assess value or quality
मूल्यांकन करना
111. appreciate (v.) = recognise value
सराहना
112. apprehensive (adj.) = anxious about the future
आशंकित
113. approach (v.) = move nearer
निकट आना
114. appropriate (adj.) = suitable in a situation
उचित
115. approve (v.) = officially agree to
मंजूरी देना
116. approximate (adj.) = close but not exact
अनुमानित
117. arbitrary (adj.) = based on personal whim
मनमाना
118. ardent (adj.) = very enthusiastic
उत्साही
119. arduous (adj.) = requiring great effort
कठिन; श्रमसाध्य
120. arise (v.) = begin to exist
उत्पन्न होना
121. arrogant (adj.) = excessively self-important
अहंकारी
122. articulate (adj.) = able to express clearly
स्पष्ट अभिव्यक्ति वाला
123. artificial (adj.) = made by humans
कृत्रिम
124. ascend (v.) = move upwards
ऊपर चढ़ना
125. ascertain (v.) = find out for certain
पता लगाना
126. aspire (v.) = strongly desire to achieve
आकांक्षा रखना
127. assault (n.) = a violent attack
हमला
128. assemble (v.) = bring together
इकट्ठा करना
129. assert (v.) = state firmly
दृढ़ता से कहना
130. assess (v.) = judge quality or value
आकलन करना
131. asset (n.) = valuable possession
संपत्ति
132. assign (v.) = give a task or role
सौंपना
133. assist (v.) = help someone
सहायता करना
134. associate (v.) = connect in the mind
संबंध जोड़ना
135. assume (v.) = accept without proof
मान लेना
136. assure (v.) = remove doubt by stating
आश्वासन देना
137. astonish (v.) = surprise greatly
चकित करना
138. astute (adj.) = quick to judge wisely
चतुर; सूझबूझ वाला
139. atrocity (n.) = extremely cruel act
अत्याचार
140. attach (v.) = join or fasten
जोड़ना
141. attain (v.) = succeed in reaching
प्राप्त करना
142. attempt (n.) = an effort to do
प्रयास
143. attentive (adj.) = paying close attention
ध्यान देने वाला
144. attitude (n.) = way of thinking
रवैया
145. attract (v.) = draw interest towards
आकर्षित करना
146. attribute (v.) = regard as caused by
कारण मानना
147. audacious (adj.) = bold and daring
दुस्साहसी
148. audit (n.) = official inspection of accounts
लेखा परीक्षा
149. augment (v.) = increase in size
बढ़ाना
150. authentic (adj.) = genuine and reliable
प्रामाणिक
151. authority (n.) = power to make decisions
अधिकार
152. autonomous (adj.) = self-governing
स्वायत्त
153. avail (v.) = make use of
लाभ उठाना
154. avenue (n.) = a possible way or route
मार्ग; उपाय
155. avert (v.) = prevent something harmful
टालना
156. avid (adj.) = very eager
उत्सुक
157. avoid (v.) = keep away from
बचना
158. await (v.) = wait for
प्रतीक्षा करना
159. awareness (n.) = knowledge of a situation
जागरूकता
160. awkward (adj.) = uncomfortable or clumsy
असहज; बेढंगा
161. backlash (n.) = strong negative reaction
तीखी प्रतिक्रिया
162. baffle (v.) = completely confuse
उलझन में डालना
163. bail (n.) = security for temporary release
जमानत
164. balance (n.) = a state of stability
संतुलन
165. ban (v.) = officially prohibit
प्रतिबंध लगाना
166. banish (v.) = send away officially
निर्वासित करना
167. bankrupt (adj.) = unable to pay debts
दिवालिया
168. bare (adj.) = uncovered or empty
खुला; खाली
169. bargain (n.) = a favourable purchase
सस्ते में अच्छा सौदा
170. barren (adj.) = unable to produce crops
बंजर
171. barrier (n.) = something blocking progress
बाधा
172. basis (n.) = underlying support or reason
आधार
173. bear (v.) = endure or carry
सहना; ढोना
174. beneficial (adj.) = producing good results
लाभकारी
175. beneficiary (n.) = person receiving a benefit
लाभार्थी
176. benefit (n.) = an advantage
लाभ
177. benevolent (adj.) = kind and helpful
परोपकारी
178. bias (n.) = unfair preference
पक्षपात
179. bid (n.) = an offer or attempt
बोली; प्रयास
180. bizarre (adj.) = very strange
विचित्र
181. blame (v.) = hold responsible for fault
दोष देना
182. bland (adj.) = lacking strong flavour
फीका
183. bleak (adj.) = without much hope
निराशाजनक
184. blend (v.) = mix together
मिलाना
185. blessing (n.) = something bringing happiness
वरदान
186. bliss (n.) = perfect happiness
परमानंद
187. blunder (n.) = a serious careless mistake
भारी भूल
188. blunt (adj.) = direct in speech
बेबाक
189. boast (v.) = speak with excessive pride
डींग मारना
190. bold (adj.) = confident and fearless
साहसी
191. bolster (v.) = support or strengthen
मजबूत करना
192. bond (n.) = a close connection
बंधन
193. boost (v.) = increase or improve
बढ़ावा देना
194. bother (v.) = trouble or annoy
परेशान करना
195. boycott (v.) = refuse to deal with
बहिष्कार करना
196. breach (n.) = violation of a rule
उल्लंघन
197. breakthrough (n.) = a major advance
बड़ी सफलता
198. brevity (n.) = shortness of expression
संक्षिप्तता
199. bribe (n.) = payment for dishonest favour
रिश्वत
200. brief (adj.) = short in duration
संक्षिप्त
201. brilliant (adj.) = exceptionally clever
प्रतिभाशाली
202. brisk (adj.) = quick and energetic
तेज; फुर्तीला
203. brittle (adj.) = easily broken
भंगुर
204. broaden (v.) = make wider
विस्तृत करना
205. brutal (adj.) = extremely cruel
क्रूर
206. budget (n.) = plan of income and spending
बजट
207. burden (n.) = a heavy responsibility
बोझ
208. bureaucracy (n.) = administration by officials
नौकरशाही
209. burgeon (v.) = grow rapidly
तेजी से बढ़ना
210. calculate (v.) = determine by using numbers
गणना करना
211. callous (adj.) = insensitive to suffering
संवेदनहीन
212. calm (adj.) = free from disturbance
शांत
213. camouflage (n.) = concealment by disguise
छद्मावरण
214. campaign (n.) = organised series of actions
अभियान
215. candid (adj.) = honest and direct
स्पष्टवादी
216. capable (adj.) = having necessary ability
सक्षम
217. capacity (n.) = maximum ability or amount
क्षमता
218. capital (n.) = money used for investment
पूँजी
219. capture (v.) = take into control
कब्जे में लेना
220. careless (adj.) = not paying enough attention
लापरवाह
221. casual (adj.) = informal or unconcerned
अनौपचारिक; बेपरवाह
222. catastrophe (n.) = a major disaster
महाविपत्ति
223. cause (n.) = reason for an event
कारण
224. cautious (adj.) = careful to avoid risk
सावधान
225. cease (v.) = stop happening
बंद होना
226. celebrate (v.) = mark a happy occasion
जश्न मनाना
227. censure (v.) = strongly criticise
कड़ी निंदा करना
228. certain (adj.) = sure or definite
निश्चित
229. challenge (n.) = a difficult task
चुनौती
230. chaos (n.) = complete disorder
अराजकता
231. charity (n.) = help for those in need
दान; परोपकार
232. charm (n.) = attractive personal quality
आकर्षण
233. cherish (v.) = hold dear
संजोकर रखना
234. chronic (adj.) = continuing for a long time
दीर्घकालिक
235. circulate (v.) = move or spread around
प्रसारित होना
236. circumstance (n.) = a surrounding condition
परिस्थिति
237. cite (v.) = mention as evidence
उद्धृत करना
238. civic (adj.) = related to citizens
नागरिक
239. civil (adj.) = polite and courteous
शिष्ट
240. clarify (v.) = make easier to understand
स्पष्ट करना
241. clash (n.) = a serious disagreement
टकराव
242. classify (v.) = arrange into categories
वर्गीकृत करना
243. cling (v.) = hold tightly
चिपके रहना
244. clumsy (adj.) = awkward in movement
अनाड़ी
245. coherent (adj.) = logical and connected
सुसंगत
246. coincide (v.) = happen at the same time
एक साथ होना
247. collaborate (v.) = work jointly
मिलकर काम करना
248. collapse (v.) = fall down suddenly
ढह जाना
249. colleague (n.) = person working with you
सहकर्मी
250. collective (adj.) = done by a group
सामूहिक
251. collision (n.) = a violent crash
टक्कर
252. combat (v.) = fight against
मुकाबला करना
253. combine (v.) = join together
मिलाना
254. comfort (n.) = ease or relief
आराम; सांत्वना
255. commence (v.) = begin
शुरू करना
256. commend (v.) = praise formally
सराहना
257. commercial (adj.) = related to business
व्यावसायिक
258. commit (v.) = pledge or carry out
प्रतिबद्ध होना; करना
259. commodity (n.) = a product for trade
व्यापारिक वस्तु
260. commonplace (adj.) = ordinary and unremarkable
सामान्य
261. communicate (v.) = share information
संवाद करना
262. community (n.) = people sharing a connection
समुदाय
263. compact (adj.) = small and efficiently arranged
सघन; सुगठित
264. companion (n.) = person accompanying another
साथी
265. comparable (adj.) = similar enough to compare
तुलनीय
266. compassion (n.) = concern for suffering
करुणा
267. compatible (adj.) = able to work well together
अनुकूल
268. compel (v.) = force someone to act
मजबूर करना
269. compensate (v.) = make up for a loss
क्षतिपूर्ति करना
270. competent (adj.) = having sufficient skill
योग्य
271. competitive (adj.) = eager or able to compete
प्रतिस्पर्धी
272. compile (v.) = collect into one work
संकलित करना
273. complacent (adj.) = too satisfied with oneself
आत्मसंतुष्ट
274. complaint (n.) = expression of dissatisfaction
शिकायत
275. complement (v.) = complete or improve something
पूरक होना
276. complex (adj.) = having many connected parts
जटिल
277. compliance (n.) = obedience to a requirement
अनुपालन
278. complicate (v.) = make more difficult
जटिल बनाना
279. compliment (n.) = an expression of praise
प्रशंसा
280. comply (v.) = act according to a rule
पालन करना
281. component (n.) = a part of a whole
घटक
282. comprehensive (adj.) = covering all main aspects
व्यापक
283. comprise (v.) = consist of
से मिलकर बना होना
284. compromise (n.) = agreement through concessions
समझौता
285. compulsory (adj.) = required by a rule
अनिवार्य
286. conceal (v.) = hide from view
छिपाना
287. concede (v.) = admit reluctantly
अनिच्छा से मानना
288. conceive (v.) = form an idea
कल्पना करना
289. concentrate (v.) = focus attention
ध्यान केंद्रित करना
290. concept (n.) = a general idea
अवधारणा
291. concern (n.) = worry or interest
चिंता; सरोकार
292. concise (adj.) = brief but clear
संक्षिप्त और स्पष्ट
293. conclude (v.) = bring to an end
निष्कर्ष निकालना; समाप्त करना
294. concrete (adj.) = specific and real
ठोस
295. condemn (v.) = express strong disapproval
निंदा करना
296. conduct (n.) = behaviour
आचरण
297. confer (v.) = grant or discuss
प्रदान करना; विचार करना
298. confess (v.) = admit a fault
स्वीकार करना
299. confidence (n.) = belief in ability
आत्मविश्वास
300. confidential (adj.) = intended to remain private
गोपनीय
"""

print("Page block 1 defined")
