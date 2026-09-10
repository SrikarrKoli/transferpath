-- =============================================================
-- Texas Transfer — School seed data
-- Safe to run multiple times: ON CONFLICT (name) DO NOTHING
-- =============================================================

INSERT INTO public.universities (name, abbreviation, location, type) VALUES

-- ── Community Colleges ──────────────────────────────────────
('Dallas College',                       'DC',      'Dallas, TX',          'community_college'),
('Collin College',                       'Collin',  'McKinney, TX',        'community_college'),
('Austin Community College',             'ACC',     'Austin, TX',          'community_college'),
('Houston Community College',            'HCC',     'Houston, TX',         'community_college'),
('San Jacinto College',                  'SJC',     'Pasadena, TX',        'community_college'),
('Lone Star College',                    'LSC',     'The Woodlands, TX',   'community_college'),
('Tarrant County College',               'TCC',     'Fort Worth, TX',      'community_college'),
('El Paso Community College',            'EPCC',    'El Paso, TX',         'community_college'),
('Alamo Colleges',                       'Alamo',   'San Antonio, TX',     'community_college'),
('McLennan Community College',           'MCC',     'Waco, TX',            'community_college'),
('Temple College',                       'Temple',  'Temple, TX',          'community_college'),
('Blinn College',                        'Blinn',   'Brenham, TX',         'community_college'),
('Kilgore College',                      'Kilgore', 'Kilgore, TX',        'community_college'),
('Tyler Junior College',                 'TJC',     'Tyler, TX',           'community_college'),
('Odessa College',                       'Odessa',  'Odessa, TX',          'community_college'),
('South Texas College',                  'STC',     'McAllen, TX',         'community_college'),
('Del Mar College',                      'DMC',     'Corpus Christi, TX',  'community_college'),
('Coastal Bend College',                 'CBC',     'Beeville, TX',        'community_college'),
('Trinity Valley Community College',     'TVCC',    'Athens, TX',          'community_college'),
('Hill College',                         'Hill',    'Hillsboro, TX',       'community_college'),
('Navarro College',                      'Navarro', 'Corsicana, TX',       'community_college'),
('Paris Junior College',                 'PJC',     'Paris, TX',           'community_college'),
('Northeast Texas Community College',    'NTCC',    'Mount Pleasant, TX',  'community_college'),
('Panola College',                       'Panola',  'Carthage, TX',        'community_college'),
('Lamar Institute of Technology',        'LIT',     'Beaumont, TX',        'community_college'),
('Lamar State College',                  'LSCO',   'Orange, TX',          'community_college'),
('Lee College',                          'Lee',     'Baytown, TX',         'community_college'),
('Galveston College',                    'GC',      'Galveston, TX',       'community_college'),
('Wharton County Junior College',        'WCJC',    'Wharton, TX',         'community_college'),
('Victoria College',                     'VC',      'Victoria, TX',        'community_college'),
('Southwest Texas Junior College',       'SWTJC',   'Uvalde, TX',          'community_college'),

-- ── Four-Year Universities ──────────────────────────────────
('The University of Texas at Austin',    'UT Austin','Austin, TX',         'four_year'),
('Texas A&M University',                 'TAMU',    'College Station, TX', 'four_year'),
('University of Houston',                'UH',      'Houston, TX',         'four_year'),
('Baylor University',                    'BU',      'Waco, TX',            'four_year'),
('Southern Methodist University',        'SMU',     'Dallas, TX',          'four_year'),
('University of Texas at San Antonio',   'UTSA',    'San Antonio, TX',     'four_year'),
('University of Texas at Arlington',     'UTA',     'Arlington, TX',       'four_year'),
('University of Texas at Dallas',        'UTD',     'Richardson, TX',      'four_year'),
('Texas Tech University',                'TTU',     'Lubbock, TX',         'four_year'),
('Texas Christian University',           'TCU',     'Fort Worth, TX',      'four_year'),
('Rice University',                      'Rice',    'Houston, TX',         'four_year'),
('Texas State University',               'TXST',    'San Marcos, TX',      'four_year'),
('University of North Texas',            'UNT',     'Denton, TX',          'four_year'),
('Texas Woman''s University',            'TWU',     'Denton, TX',          'four_year'),
('Sam Houston State University',         'SHSU',    'Huntsville, TX',      'four_year'),
('Stephen F. Austin State University',   'SFA',     'Nacogdoches, TX',     'four_year'),
('Lamar University',                     'Lamar',   'Beaumont, TX',        'four_year'),
('Angelo State University',              'ASU',     'San Angelo, TX',      'four_year'),
('Tarleton State University',            'Tarleton','Stephenville, TX',    'four_year'),
('Texas A&M University-Commerce',        'TAMUC',   'Commerce, TX',        'four_year'),
('Texas A&M University-Corpus Christi',  'TAMUCC',  'Corpus Christi, TX',  'four_year'),
('Texas A&M University-Kingsville',      'TAMUK',   'Kingsville, TX',      'four_year'),
('Prairie View A&M University',          'PVAMU',   'Prairie View, TX',    'four_year'),
('West Texas A&M University',            'WTAMU',   'Canyon, TX',          'four_year'),
('University of Houston-Downtown',       'UHD',     'Houston, TX',         'four_year'),
('University of Houston-Clear Lake',     'UHCL',    'Houston, TX',         'four_year'),
('University of Houston-Victoria',       'UHV',     'Victoria, TX',        'four_year'),
('Texas Southern University',            'TSU',     'Houston, TX',         'four_year'),
('Abilene Christian University',         'ACU',     'Abilene, TX',         'four_year'),
('Hardin-Simmons University',            'HSU',     'Abilene, TX',         'four_year'),
('LeTourneau University',                'LETU',    'Longview, TX',        'four_year'),
('University of Mary Hardin-Baylor',     'UMHB',    'Belton, TX',          'four_year'),
('Texas Lutheran University',            'TLU',     'Seguin, TX',          'four_year'),
('Schreiner University',                 'Schreiner','Kerrville, TX',      'four_year'),
('University of the Incarnate Word',     'UIW',     'San Antonio, TX',     'four_year'),
('St. Mary''s University',               'StMU',    'San Antonio, TX',     'four_year'),
('Trinity University',                   'Trinity', 'San Antonio, TX',     'four_year'),
('Texas A&M International University',   'TAMIU',   'Laredo, TX',          'four_year'),
('Midwestern State University',          'MSU',     'Wichita Falls, TX',   'four_year'),
('Sul Ross State University',            'SRSU',    'Alpine, TX',          'four_year')

ON CONFLICT (name) DO NOTHING;

-- =============================================================
-- School-specific requirement notes (university_id NOT NULL)
-- Safe to run multiple times: WHERE NOT EXISTS guards per note title
-- Must run after universities are inserted — migrations run before seed.sql
-- =============================================================

-- The University of Texas at Austin
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'Coordinated Admission Program (CAP)', 'CAP is specific to the UT System. If you are a CAP student at a partner school, understand which UT campus you are guaranteed and what steps are required for your intended major — verify with your advisor and UT.', 'https://admissions.utexas.edu/'),
  (1, 'Transfer credit hours', 'Many competitive majors expect substantial transferable credit. Review UT''s external transfer guides for your college and confirm how your courses map — planning only.', 'https://admissions.utexas.edu/apply/transfer'),
  (2, 'Major-specific requirements', 'Some majors have additional coursework or GPA expectations beyond university minimums. Use official UT degree and department pages for your program.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'The University of Texas at Austin'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- Texas A&M University
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'Transfer admission basics', 'Review Texas A&M''s transfer admissions hub for entry terms, document submission, and how coursework is evaluated — confirm all details on the official site.', 'https://admissions.tamu.edu/apply/transfer'),
  (1, 'Major and college requirements', 'Some colleges may publish recommended or required preparatory coursework. Cross-check your intended catalog year on official A&M pages.', 'https://admissions.tamu.edu/academics/majors'),
  (2, 'Engineering Pathways and similar programs', 'If you are following a pathway from a partner college, keep documentation of progress and confirm deadlines with both institutions.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'Texas A&M University'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- University of Houston
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'UH transfer overview', 'Use UH''s undergraduate admissions resources for transfer GPAs, deadlines, and document requirements — illustrative only here.', 'https://www.uh.edu/undergraduate/admissions/apply/transfer/'),
  (1, 'College and major expectations', 'Majors may list prerequisites or performance expectations. Confirm on the department and college sites linked from official admissions.', 'https://www.uh.edu/undergraduate/admissions/'),
  (2, 'Scholarship and residency', 'Review scholarship timelines and Texas residency rules on official UH pages if they affect your plan.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'University of Houston'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- Baylor University
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'Baylor transfer planning', 'Review Baylor''s admission materials for transfer terms, faith and community expectations if applicable, and required transcripts.', 'https://www.baylor.edu/admissions/'),
  (1, 'Course credit and degree plans', 'Confirm how your credits apply toward your intended Baylor degree using official transfer and advising resources.', 'https://www.baylor.edu/admissions/'),
  (2, 'Scholarship windows', 'Institutional scholarships may have earlier deadlines than general admission — verify on Baylor financial aid pages.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'Baylor University'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- University of Texas at Dallas
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'UT Dallas transfer resources', 'Confirm application steps, transcript rules, and term options on official UT Dallas enrollment pages.', 'https://www.utd.edu/enroll/transfer/'),
  (1, 'School-specific majors', 'Some schools publish additional transfer guidance. Use the official catalog and advising contacts for your major.', 'https://www.utd.edu/'),
  (2, 'Merit and residency', 'Check residency classification and scholarship dates separately from general admission where applicable.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'University of Texas at Dallas'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- Rice University
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'Rice transfer overview', 'Rice publishes transfer-specific instructions and expectations — use official admissions pages as the source of truth.', 'https://futureowls.rice.edu/apply'),
  (1, 'Course rigor and fit', 'Strong preparation in relevant disciplines is typical; confirm recommended coursework with Rice and your current advisors.', 'https://futureowls.rice.edu/'),
  (2, 'Financial planning', 'Review aid and scholarship information on official Rice sites in parallel with application work.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'Rice University'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- Southern Methodist University
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'SMU transfer admission', 'Review SMU''s transfer application steps, deadlines, and portfolio or school-specific supplements on official admission pages.', 'https://www.smu.edu/Admission/Apply/TransferAdmission'),
  (1, 'Degree requirements', 'Confirm how transferred credits satisfy SMU degree components through official academic bulletins and advising.', 'https://www.smu.edu/Catalogs'),
  (2, 'Scholarships', 'Institutional awards may have separate timelines — verify on SMU financial aid pages.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'Southern Methodist University'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );

-- Texas Christian University
INSERT INTO public.university_requirement_notes (university_id, sort_order, title, body, optional_url)
SELECT u.id, v.sort_order, v.title, v.body, v.optional_url
FROM public.universities u
CROSS JOIN (VALUES
  (0, 'TCU transfer basics', 'Use TCU admissions for transfer eligibility, document submission, and orientation expectations — planning copy only here.', 'https://admissions.tcu.edu/apply/transfer/'),
  (1, 'College and major fit', 'Colleges within TCU may highlight recommended preparation; confirm with official sites and your advisor.', 'https://admissions.tcu.edu/'),
  (2, 'Housing and enrollment', 'Review housing and enrollment steps on official TCU pages once admitted.', NULL::text)
) AS v(sort_order, title, body, optional_url)
WHERE u.name = 'Texas Christian University'
  AND NOT EXISTS (
    SELECT 1 FROM public.university_requirement_notes n
    WHERE n.university_id = u.id AND n.title = v.title
  );
