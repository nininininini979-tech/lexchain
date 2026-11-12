'use strict';
// Reviewed against the 2026-11-10 logic audit. Reference notes are not executable rules.
window.LexChainTheory = [
  {
    "id": "D01",
    "name": "SDL 标准道义逻辑（Standard Deontic Logic）",
    "tag": "独立研究模块已实现 KD",
    "formula": "O(φ→ψ)→(Oφ→Oψ)；Oφ→¬O¬φ；Pφ≡¬O¬φ（SDL/KD 中）",
    "scope": "劳动争议规则路径仍使用O/F/P标签；独立KD研究台新增命题模态解析、闭合表求解、反模型与检查器。",
    "note": "2026-11-11新增独立命题KD模块，采用串行Kripke语义。支持有限公式的布尔连接词和O/P嵌套，给出闭合表证书或模型；资源耗尽返回UNKNOWN。未自动翻译劳动法规则；二元条件义务另在有限排序模块研究，主体量词未实现。与1951年历史起点及现代KD公理化的关系仍应区分。",
    "references": [
      {
        "id": "vonWright1951",
        "title": "von Wright, Georg Henrik. 1951. Deontic Logic. Mind 60(237): 1–15.",
        "url": "https://doi.org/10.1093/mind/LX.237.1"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D02",
    "name": "模态基础（必然 / 可能）",
    "tag": "研究模块实现串行框架",
    "formula": "◇φ≡¬□¬φ；T: □φ→φ；5: ◇φ→□◇φ（S5 可取 K+T+5）",
    "scope": "独立KD研究台有世界、可达关系和二值赋值；不采用S5，劳动争议K3输入层与之分开。",
    "note": "KD要求每个世界至少有后继，不要求反身、传递或欧几里得关系。Oφ→φ、Oφ→OOφ和Pφ→OPφ不一般有效；研究台可给反模型。K3的U不等同于模态可能性或主体知识。",
    "references": [
      {
        "id": "Anderson1958",
        "title": "Anderson, Alan Ross. 1958. A Reduction of Deontic Logic to Alethic Modal Logic. Mind 67(265): 100–103.",
        "url": "https://doi.org/10.1093/mind/LXVII.265.100"
      },
      {
        "id": "SEP-Modal",
        "title": "Stanford Encyclopedia of Philosophy. Modal Logic.",
        "url": "https://plato.stanford.edu/entries/logic-modal/"
      }
    ]
  },
  {
    "id": "D03",
    "name": "CTD 违约后义务（Contrary-to-Duty）",
    "tag": "独立有限排序模块已实现",
    "formula": "O(ψ/φ)：在条件 φ 下应当 ψ（记法；须另给具体演算）",
    "scope": "独立条件研究台支持最佳条件世界语义、Chisholm 算例及补救情境；原劳动规则仍独立执行。",
    "note": "新增模块用 O(B|A) 表示最佳 A 世界均满足 B，分别查询理想条件与违约情境，避免把两者都不加区分地变成无条件义务。采用有限全赋值排序语义，只接受命题条件/结果；不是所有二元道义逻辑的完整实现，也未加入时间或案件证据认证。例外阻断与 CTD 是不同机制。",
    "references": [
      {
        "id": "Chisholm1963",
        "title": "Chisholm, Roderick M. 1963. Contrary-To-Duty Imperatives and Deontic Logic. Analysis 24(2): 33–36.",
        "url": "https://doi.org/10.1093/analys/24.2.33"
      },
      {
        "id": "PrakkenSergot1996",
        "title": "Prakken, Henry, and Marek Sergot. 1996. Contrary-to-Duty Obligations. Studia Logica 57(1): 91–115.",
        "url": "https://doi.org/10.1007/BF00370671"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D04",
    "name": "偏好道义语义与规范优先序",
    "tag": "独立有限排序与选择策略",
    "formula": "条件义务示意：选定条件域中的所有最优世界满足 φ；须先定义优序及最优世界存在性",
    "scope": "条件模块实现有限全赋值排序及独立的优先子理论选择；没有权重聚合或阈值算法。",
    "note": "条件义务在满足条件的最佳世界判断；模型使用有限自然数排序且包含全部背景可行赋值。规则优先序是另一层明确定义的策略：高层先比较，同层按集合包含关系保留全部极大一致方案，以共同后承输出结论。此策略不等同于文献中所有偏好道义逻辑，也不自动判断法规效力。权重聚合与 leximax 不在实现范围内。",
    "references": [
      {
        "id": "Parent2014",
        "title": "Parent, Xavier. 2014. Maximality vs. Optimality in Dyadic Deontic Logic: Completeness Results for Systems in Hansson’s Tradition. Journal of Philosophical Logic 43(6): 1101–1128.",
        "url": "https://doi.org/10.1007/s10992-013-9308-0"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D05",
    "name": "道义—认知交叉（Epistemic-Deontic）",
    "tag": "理论参考（未实现）",
    "formula": "K_aφ→φ（事实性知识系统）；K_aφ 与 O(φ→ψ) 一般不足以推出 Oψ",
    "scope": "信息未知控制；未实现主体知识模态",
    "note": "K_aφ→φ 是事实性公理；K_aφ∧O_a(φ→ψ)⊢O_aψ 不是 K 与 O 独立系统的有效规则：实际世界 φ 为真不能保证理想世界 φ 为真。例如实际 φ 真，理想世界 φ、ψ 都假，义务条件句仍真而 Oψ 假。需要额外交互公理。U 只说明系统缺少输入，不说明行为人不知情，也不能推出客观义务不存在。",
    "references": [
      {
        "id": "SEP-Epistemic",
        "title": "Stanford Encyclopedia of Philosophy. Epistemic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-epistemic/"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D06",
    "name": "道义博弈逻辑（Deontic Game Logic）",
    "tag": "理论参考（未实现）",
    "formula": "∃σ_a∀σ_−a φ 表示保证结果的策略能力，不能单独定义义务",
    "scope": "路线图",
    "note": "∃σ_a∀σ_−a φ 通常表达主体具有保证 φ 的策略能力；单凭能力不能定义应当。战略道义逻辑还需规范、效用、理想策略或优势关系。页面的 Per 对偶取决于先给出合法的 Obl 语义；不能将 can 自动等同 ought。",
    "references": [
      {
        "id": "Tamminga2013",
        "title": "Tamminga, Allard. 2013. Deontic Logic for Strategic Games. Erkenntnis 78(1): 183–200.",
        "url": "https://doi.org/10.1007/s10670-011-9349-0"
      },
      {
        "id": "SEP-Action",
        "title": "Stanford Encyclopedia of Philosophy. The Logic of Action.",
        "url": "https://plato.stanford.edu/entries/logic-action/"
      },
      {
        "id": "SEP-Game",
        "title": "Stanford Encyclopedia of Philosophy. Game Theory.",
        "url": "https://plato.stanford.edu/entries/game-theory/"
      }
    ]
  },
  {
    "id": "D07",
    "name": "道义动态逻辑（Dynamic Deontic Logic, DDL）",
    "tag": "理论参考（未实现）",
    "formula": "⟨α⟩φ≡¬[α]¬φ；[α](φ∧ψ)↔([α]φ∧[α]ψ)",
    "scope": "路线图",
    "note": "动态对偶与 [α] 对合取、⟨α⟩ 对析取的分配是标准动态逻辑性质。Oφ≝[α*](violation→sanction) 右侧没有出现 φ，除非另外给出 violation(φ)、sanction(φ)、行动和可终止性语义，否则不能作为 φ 相关义务的定义。程序条件的布尔输入并不构成路径模型。",
    "references": [
      {
        "id": "SEP-Dynamic",
        "title": "Stanford Encyclopedia of Philosophy. Propositional Dynamic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-dynamic/"
      },
      {
        "id": "Anderson1958",
        "title": "Anderson, Alan Ross. 1958. A Reduction of Deontic Logic to Alethic Modal Logic. Mind 67(265): 100–103.",
        "url": "https://doi.org/10.1093/mind/LXVII.265.100"
      }
    ]
  },
  {
    "id": "D08",
    "name": "道义模糊逻辑（Fuzzy Deontic）",
    "tag": "理论参考（未实现）",
    "formula": "x⊗_Ły=max(0,x+y−1)；x→_Ły=min(1,1−x+y)；格合取 x∧y=min(x,y)",
    "scope": "路线图",
    "note": "max(0,x+y−1) 是 Łukasiewicz 强合取/张量 t-范数，min(1,1−x+y) 是其剩余蕴含；若符号 ∧ 表示格合取，则应为 min(x,y)，须区分 ∧ 与 ⊗。O_λ 的阈值及边界带是项目拟议定义，没有在代码中实现或从这些公式自动推出。U 不应被解释为数值 0.5 的主观概率。",
    "references": [
      {
        "id": "SEP-Fuzzy",
        "title": "Stanford Encyclopedia of Philosophy. Fuzzy Logic.",
        "url": "https://plato.stanford.edu/entries/logic-fuzzy/"
      },
      {
        "id": "Zadeh1965",
        "title": "Zadeh, Lotfi A. 1965. Fuzzy Sets. Information and Control 8(3): 338–353.",
        "url": "https://doi.org/10.1016/S0019-9958(65)90241-X"
      }
    ]
  },
  {
    "id": "D09",
    "name": "道义时态逻辑（Temporal Deontic）",
    "tag": "理论参考（未实现）",
    "formula": "G(Oφ)、O(Gφ)、O(Xφ) 是不同作用域；时态求值需时间模型",
    "scope": "路线图；只有数值时长输入及文字提醒",
    "note": "G(Oφ)、O(Gφ)、O(Xφ) 在多模态语言中可区分，但『重新产生』和『一次产生』还需事件语义，不能仅靠括号认定。页面把时效经过直接写成胜诉权消灭是额外法律命题，需考虑法域、抗辩、起算、中止中断等，不能当时态逻辑定理。未发现 X/F/G/H 的求值器。",
    "references": [
      {
        "id": "SEP-Temporal",
        "title": "Stanford Encyclopedia of Philosophy. Temporal Logic.",
        "url": "https://plato.stanford.edu/entries/logic-temporal/"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D10",
    "name": "霍费尔德法律本体论（Hohfeld）",
    "tag": "概念参考",
    "formula": "Claim(a,b,φ) ↔ Duty(b,a,φ)；Privilege(a,b,φ) ↔ NoRight(b,a,¬φ)",
    "scope": "概念对应及静态矩阵；无二元权利关系演算",
    "note": "霍费尔德相关项与相反项须带主体和对象：Claim(a,b,φ) 对应 Duty(b,a,φ)，Privilege(a,b,φ) 对应 NoRight(b,a,¬φ)。项目 O(employer,act) 没有权利相对人槽位。解除权常涉及 power，不能全部还原为 privilege；违法行使权力也不必然等于法律上无能力，因此 R42 的禁止不能无条件等同 immunity/disability。",
    "references": [
      {
        "id": "Hohfeld1913",
        "title": "Hohfeld, Wesley Newcomb. 1913. Some Fundamental Legal Conceptions as Applied in Judicial Reasoning. Yale Law Journal 23(1): 16–59. 另见 1919 年同名论文集。",
        "url": "https://plato.stanford.edu/entries/rights/"
      },
      {
        "id": "SEP-Rights",
        "title": "Stanford Encyclopedia of Philosophy. Rights.",
        "url": "https://plato.stanford.edu/entries/rights/"
      }
    ]
  },
  {
    "id": "D11",
    "name": "STIT 主事性逻辑（Seeing-To-It-That）",
    "tag": "理论参考（未实现）",
    "formula": "[a stit:φ]→φ（成功性，限相应 STIT 语义）；无行为保证不自动推出无赔偿义务",
    "scope": "路线图",
    "note": "[a stit:φ]→φ 的成功性有标准 STIT 语义支持，需分支时间和选择分区等结构。¬[a stit:damage]⇒¬Obl(a,comp) 不是一般有效式：赔偿义务可能来自严格责任、替代责任、担保等。主体可控性也不能单独穷尽法定归责。",
    "references": [
      {
        "id": "Belnap2001",
        "title": "Belnap, Nuel, Michael Perloff, and Ming Xu. 2001. Facing the Future. Oxford University Press.",
        "url": "https://plato.stanford.edu/entries/logic-action/#Bib"
      },
      {
        "id": "Horty2001",
        "title": "Horty, John F. 2001. Agency and Deontic Logic. Oxford University Press.",
        "url": "https://doi.org/10.1093/0195134613.001.0001"
      },
      {
        "id": "SEP-Action",
        "title": "Stanford Encyclopedia of Philosophy. The Logic of Action.",
        "url": "https://plato.stanford.edu/entries/logic-action/"
      }
    ]
  },
  {
    "id": "D12",
    "name": "可废止逻辑（Defeasible Logic）",
    "tag": "已用局部例外",
    "formula": "C_r=T 且某 E_r=T ⇒ 本规则状态 DEFEATED；不由此推出 ¬N_r",
    "scope": "局部例外阻断已实现；没有完整 Defeasible Logic",
    "note": "exceptions 在单规则内阻断该规则，未实现 strict/defeasible/defeater 三类证明规则、全局 superiority、结论冲突检索或 ±Δ/±∂ 证明标签。DEFEATED 意为不能由本规则输出结论，不推出相反结论 ¬pay，更不推出 ¬O(pay)。页面『最小完备实现』无证明支持；refuseContract⇒¬pay 的例子还混淆工资与二倍工资差额。",
    "references": [
      {
        "id": "Nute1994",
        "title": "Nute, Donald. 1994. Defeasible Logics. In Handbook of Logic in Artificial Intelligence and Logic Programming, Vol. 3. Oxford University Press, 353–395.",
        "url": "https://plato.stanford.edu/entries/logic-nonmonotonic/#Bib"
      },
      {
        "id": "Antoniou2001",
        "title": "Antoniou, Grigoris, David Billington, Guido Governatori, and Michael J. Maher. 2001. Representation Results for Defeasible Logic. ACM Transactions on Computational Logic 2(2): 255–287.",
        "url": "https://doi.org/10.1145/371316.371517"
      },
      {
        "id": "SEP-Nonmonotonic",
        "title": "Stanford Encyclopedia of Philosophy. Non-monotonic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-nonmonotonic/"
      }
    ]
  },
  {
    "id": "D13",
    "name": "输入/输出逻辑（Input/Output Logic）",
    "tag": "理论参考（未实现）",
    "formula": "SI: (a,b) ⇒ (a∧c,b)；WO: (a,b), b⊢c ⇒ (a,c)；含 WO 时可得 (a,b∨c)",
    "scope": "路线图",
    "note": "原文中文名称颠倒：SI 是 strengthening of input（强化输入），WO 是 weakening of output（弱化输出）。由 (a,b) 得 (a∧c,b)；由 b⊢c 和 (a,b) 得 (a,c)。因 b⊢b∨c，含 WO 的系统能从 (⊤,b) 得 (⊤,b∨c)，原文『推不出 Ross 式』与其列出的 WO 自相矛盾。是否非爆炸取决于具体输出操作和一致性约束，不能仅以规范无真值保证。",
    "references": [
      {
        "id": "Makinson2000",
        "title": "Makinson, David, and Leendert van der Torre. 2000. Input/Output Logics. Journal of Philosophical Logic 29(4): 383–408.",
        "url": "https://doi.org/10.1023/A:1004748624537"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D14",
    "name": "次协调道义逻辑（Paraconsistent Deontic）",
    "tag": "理论参考（未实现）",
    "formula": "p,¬p ⊬ q（非爆炸的刻画）；K3 的 U 不表示同时支持 p 与 ¬p",
    "scope": "路线图；K3 不等于次协调",
    "note": "非爆炸的通用刻画为 p,¬p ⊬ q；规范冲突不爆炸必须给出具体道义系统。强 Kleene K3（仅 T 为指定值）中没有 p 与 ¬p 同时为指定值的赋值，不能据 U 宣称次协调。ω-一致性是另一个技术概念，页面的解释不是其定义。冲突自由子集 C(Γ) 未必唯一，选择方法必须指定。",
    "references": [
      {
        "id": "SEP-Paraconsistent",
        "title": "Stanford Encyclopedia of Philosophy. Paraconsistent Logic.",
        "url": "https://plato.stanford.edu/entries/logic-paraconsistent/"
      },
      {
        "id": "SEP-MV",
        "title": "Stanford Encyclopedia of Philosophy. Many-Valued Logic.",
        "url": "https://plato.stanford.edu/entries/logic-manyvalued/"
      }
    ]
  },
  {
    "id": "D15",
    "name": "语境道义逻辑（CDL, Contextual）",
    "tag": "理论参考（未实现）",
    "formula": "O(φ/ψ,c) 为项目可选记法；语境更新不预设单调性",
    "scope": "路线图；项目建议记号",
    "note": "O(φ/ψ,c) 可以作为自定义三参数语言，但没有找到该具体 CDL 公理系统的引文。语境变更可增加、撤回或改变义务；不能普遍要求按包含关系单调更新。需要定义地区、时间、事项适用域与规范冲突处理。",
    "references": [
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D16",
    "name": "行为道义逻辑（ADL, Act-based）",
    "tag": "概念参考",
    "formula": "F_aα ≝ O_a¬E(a,α)（可选定义；需固定行动与命题类型）",
    "scope": "行为名称作为字符串已用；未实现行动逻辑",
    "note": "若 E(a,α) 表示 a 实施 α，F_aα≝O_a¬E(a,α) 是可选择的语义定义。E(a,α)∧E(α→β)⊢E(a,β) 中 E 的元数不一致，α→β 的类型与行动组合均未定义，不是可以直接引用的标准规则。act 和 bearer 文本不等于行动代数。",
    "references": [
      {
        "id": "vonWright1963",
        "title": "von Wright, Georg Henrik. 1963. Norm and Action: A Logical Enquiry. New York: Humanities Press.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/#Bib"
      },
      {
        "id": "SEP-Action",
        "title": "Stanford Encyclopedia of Philosophy. The Logic of Action.",
        "url": "https://plato.stanford.edu/entries/logic-action/"
      }
    ]
  },
  {
    "id": "D17",
    "name": "信念—道义交叉（BDL）",
    "tag": "理论参考（未实现）",
    "formula": "B_aφ 不一般蕴涵 φ；法律上的故意需要额外主观与客观要件",
    "scope": "路线图",
    "note": "信念非事实性：B_a¬φ 不保证实际 ¬φ；知道规范并相信违反也不足以形式化法律上的故意。需区分信念、知识、意图、行为、结果、注意义务与法定主观要件。『只影响量罚不影响义务存在』不是跨法域通用公理。",
    "references": [
      {
        "id": "SEP-Epistemic",
        "title": "Stanford Encyclopedia of Philosophy. Epistemic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-epistemic/"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D18",
    "name": "量化动态道义逻辑（Quantified DDL）",
    "tag": "理论参考（未实现）",
    "formula": "∀x[α]φ 与 [α]∀xφ 的等价需域、绑定及程序依赖等条件；此处不作无条件交换",
    "scope": "路线图",
    "note": "量词、动态与 O 可嵌套，但 ∀x[α]φ↔[α]∀xφ 需要明确常域/变域、变量绑定及 α 不含相关自由依赖等条件；只说『x 未被修改』不够。动态逻辑中的状态变量与量词变量还须区分。义务在最外层与行动后义务通常不同，原文的中文释义没有固定这种作用域。",
    "references": [
      {
        "id": "SEP-Dynamic",
        "title": "Stanford Encyclopedia of Philosophy. Propositional Dynamic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-dynamic/"
      },
      {
        "id": "SEP-Types",
        "title": "Stanford Encyclopedia of Philosophy. Type Theory.",
        "url": "https://plato.stanford.edu/entries/type-theory/"
      },
      {
        "id": "SEP-Combining",
        "title": "Stanford Encyclopedia of Philosophy. Combining Logics.",
        "url": "https://plato.stanford.edu/entries/logic-combining/"
      }
    ]
  },
  {
    "id": "D19",
    "name": "多主体可废止道义逻辑（MADL）",
    "tag": "理论参考（未实现）",
    "formula": "O_Gφ 不一般等于 ∧_{a∈G} O_aφ_a；任务分解需要独立假设",
    "scope": "路线图；自定义群体分解",
    "note": "群体义务不普遍等于成员义务的合取，任务可分解性、协调能力、承担方式都需假设。MADL 名称未附指定演算。主体规则库优先序可比较也不足以保证全局无环或所有规范冲突可消解。",
    "references": [
      {
        "id": "Horty2001",
        "title": "Horty, John F. 2001. Agency and Deontic Logic. Oxford University Press.",
        "url": "https://doi.org/10.1093/0195134613.001.0001"
      },
      {
        "id": "SEP-Action",
        "title": "Stanford Encyclopedia of Philosophy. The Logic of Action.",
        "url": "https://plato.stanford.edu/entries/logic-action/"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D20",
    "name": "道义高阶逻辑（Deontic HOL）",
    "tag": "理论参考（未实现）",
    "formula": "λx.F(x) 为谓词；O 的输入类型须另定义。Oφ 不推出事实 φ",
    "scope": "路线图",
    "note": "∀P(Obl(P)∧定效力(P)→P(c)) 将义务有效性推成实际事实，属于应然到实然的额外跳跃，非高阶逻辑定理。λx.F(x) 为谓词类型而不是命题，O 的类型须专门定义。『一阶层可判定、高阶层不可判定』的暗示也不准确：一般一阶有效性本就不可判定，完整高阶语义另有不可有效公理化问题。",
    "references": [
      {
        "id": "Church1940",
        "title": "Church, Alonzo. 1940. A Formulation of the Simple Theory of Types. Journal of Symbolic Logic 5: 56–68.",
        "url": "https://plato.stanford.edu/entries/type-theory/#Bib"
      },
      {
        "id": "SEP-Types",
        "title": "Stanford Encyclopedia of Philosophy. Type Theory.",
        "url": "https://plato.stanford.edu/entries/type-theory/"
      }
    ]
  },
  {
    "id": "D21",
    "name": "道义自指悖论消解",
    "tag": "概念参考",
    "formula": "O(Oφ) 是模态迭代，本身不等于自指；分层设计需类型与语法检查",
    "scope": "架构类比；无层级语法或类型检查器",
    "note": "对象语言/元语言分层与类型限制可借鉴 Tarski、Russell/Church 传统，但页面没有给出可检验的分层演算。O(Oφ) 本身是模态迭代而非自动自指；O(s(s)) 的类型甚至未定义。规则文件与引擎文件分离不能替代无自指、无悖论或一致性的证明。",
    "references": [
      {
        "id": "SEP-Types",
        "title": "Stanford Encyclopedia of Philosophy. Type Theory.",
        "url": "https://plato.stanford.edu/entries/type-theory/"
      },
      {
        "id": "SEP-Wittgenstein",
        "title": "Stanford Encyclopedia of Philosophy. Ludwig Wittgenstein.",
        "url": "https://plato.stanford.edu/entries/wittgenstein/"
      }
    ]
  },
  {
    "id": "D22",
    "name": "道义证明—认知交叉（JEM）",
    "tag": "已用执行记录",
    "formula": "s:(φ→ψ)→(t:φ→(s·t):ψ)（证明项应用）；t:φ→φ 仅限事实性系统",
    "scope": "原执行轨迹仍不是Justification Logic；新增KD模块的闭合表证书有单独检查器，共享解析和NNF模块。",
    "note": "证明/证成逻辑通常使用 t:φ 及应用算子，如 s:(φ→ψ)→(t:φ→(s·t):ψ)，事实性形式为 t:φ→φ（在事实性系统中）。Kφ≝Jφ∧φ 不是 Artemov 逻辑的标准定义，也不能仅以有根据且真定义知识。symbol 与 nlChain 是说明日志；没有证据项代数、证明对象或独立校验器。JEM 缩写的具体来源未定位。",
    "references": [
      {
        "id": "Artemov2001",
        "title": "Artemov, Sergei. 2001. Explicit Provability and Constructive Semantics. Bulletin of Symbolic Logic 7(1): 1–36.",
        "url": "https://plato.stanford.edu/entries/logic-justification/#Bib"
      },
      {
        "id": "SEP-Justification",
        "title": "Stanford Encyclopedia of Philosophy. Justification Logic.",
        "url": "https://plato.stanford.edu/entries/logic-justification/"
      }
    ]
  },
  {
    "id": "D23",
    "name": "反义务博弈的子博弈完美均衡",
    "tag": "理论参考（未实现）",
    "formula": "∀a∀σ′_a: u_a(σ*)≥u_a(σ′_a,σ*₋ₐ)；子博弈完美要求每个子博弈上的限制均为纳什均衡",
    "scope": "路线图",
    "note": "纳什均衡不等式是标准形式。子博弈完美要求在每一个子博弈（包括整个博弈）上的限制都是纳什均衡；非初始历史不必都开启一个子博弈（不完全信息尤其如此）。b<c 只有在完整收益、执行概率、行动和信息假设下才可能支持守约结论，不能单独证明均衡。",
    "references": [
      {
        "id": "Nash1950",
        "title": "Nash, John. 1950. Equilibrium Points in n-Person Games. Proceedings of the National Academy of Sciences 36: 48–49.",
        "url": "https://plato.stanford.edu/entries/game-theory/#Bib"
      },
      {
        "id": "SEP-Game",
        "title": "Stanford Encyclopedia of Philosophy. Game Theory.",
        "url": "https://plato.stanford.edu/entries/game-theory/"
      }
    ]
  },
  {
    "id": "D24",
    "name": "超序列道义演算（Hypersequent）",
    "tag": "理论参考（未实现）",
    "formula": "Γ₁⊢Δ₁ | … | Γ_n⊢Δ_n（超序列结构）；模态引入规则须指明具体演算及侧条件",
    "scope": "路线图",
    "note": "规范中文通常为『超序列演算』，页面的『超矢列』属译名问题。超序列的竖线是结构连接词，需说明外部规则及语义。页面 O-引入规则没有侧条件或特定演算来源，不能因单组件含 ⊢φ 就把它当作任意系统中的有效模态规则。",
    "references": [
      {
        "id": "Avron1991",
        "title": "Avron, Arnon. 1991. Hypersequents, Logical Consequence and Intermediate Logics for Concurrency. Annals of Mathematics and Artificial Intelligence 4: 225–248.",
        "url": "https://doi.org/10.1007/BF01531058"
      },
      {
        "id": "Gentzen1935",
        "title": "Gentzen, Gerhard. 1935. Untersuchungen über das logische Schließen. I. Mathematische Zeitschrift 39: 176–210.",
        "url": "https://doi.org/10.1007/BF01201353"
      }
    ]
  },
  {
    "id": "D25",
    "name": "自适应道义逻辑（Adaptive Logic）",
    "tag": "理论参考（未实现）",
    "formula": "自适应后承由下限逻辑、异常集合及策略共同决定；标记不等于发现任意 Ab",
    "scope": "路线图",
    "note": "自适应逻辑的标记取决于下限逻辑、异常集合和策略（如可靠性、最小异常），不能简化为『路径出现 Ab 即标记』。当前 analyze 每次重新求值，没有保存带条件推导、依赖图或增量撤销轨迹。",
    "references": [
      {
        "id": "SEP-Nonmonotonic",
        "title": "Stanford Encyclopedia of Philosophy. Non-monotonic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-nonmonotonic/"
      },
      {
        "id": "SEP-Paraconsistent",
        "title": "Stanford Encyclopedia of Philosophy. Paraconsistent Logic.",
        "url": "https://plato.stanford.edu/entries/logic-paraconsistent/"
      }
    ]
  },
  {
    "id": "D26",
    "name": "反常识公式集（Deontic Paradoxes）",
    "tag": "概念参考",
    "formula": "Ross: O(p)⊢O(p∨q)（SDL）；O¬(r∧h)⊬O¬h，反例理想世界 r=F,h=T；Forrester 分析需补足事实前提",
    "scope": "理论示例；部分公式错误",
    "note": "Ross: O(p)⊢O(p∨q) 是 SDL 的典型弱化后果，但不是 O(p)⊢P(q)。Good Samaritan 原式 O¬(r∧h)⊢O¬h 无效：唯一理想世界取 r=F、h=T，则前件真而结论假。Forrester 的轻杀例须补充实际发生杀人 m、轻杀 g→m 及义务封闭等假设；仅 O¬m∧(m→Og) 不推出 Og（m 假即可反例）。",
    "references": [
      {
        "id": "Ross1941",
        "title": "Ross, Alf. 1941. Imperatives and Logic. Theoria 7(1): 53–71.",
        "url": "https://doi.org/10.1111/j.1755-2567.1941.tb00034.x"
      },
      {
        "id": "Forrester1984",
        "title": "Forrester, James William. 1984. Gentle Murder, or the Adverbial Samaritan. Journal of Philosophy 81(4): 193–197.",
        "url": "https://doi.org/10.2307/2026120"
      },
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      }
    ]
  },
  {
    "id": "D27",
    "name": "超赋值道义逻辑（Supervaluationist）",
    "tag": "理论参考（未实现）",
    "formula": "超真：所有可容许精化下为真；超假：所有可容许精化下为假；其余未定",
    "scope": "路线图",
    "note": "全体可容许精化下均真定义超真，均假定义超假，其余不定；Oφ 的超真还需每个精化中的道义语义。超赋值通常保留经典排中律，即使某 p 本身不定；这与 K3 在 p=U 时 p∨¬p=U 不同。30/60/90 日只是项目例子，没有法律或模型依据证明它们构成全部合法精化。",
    "references": [
      {
        "id": "Fine1975",
        "title": "Fine, Kit. 1975. Vagueness, Truth and Logic. Synthese 30(3–4): 265–300.",
        "url": "https://doi.org/10.1007/BF00485047"
      },
      {
        "id": "SEP-MV",
        "title": "Stanford Encyclopedia of Philosophy. Many-Valued Logic.",
        "url": "https://plato.stanford.edu/entries/logic-manyvalued/"
      },
      {
        "id": "SEP-Vagueness",
        "title": "Stanford Encyclopedia of Philosophy. Vagueness.",
        "url": "https://plato.stanford.edu/entries/vagueness/"
      }
    ]
  },
  {
    "id": "D28",
    "name": "多模态融合极限表达",
    "tag": "理论参考（未实现）",
    "formula": "模态融合的保性质结果有适用前提；框架乘积、交互公理和软件模块化是不同概念",
    "scope": "路线图",
    "note": "独立正规模态逻辑的融合有条件性的保性质结果，需明确不交叠模态签名及融合定义；加入交互公理后不能直接继承一致性。乘积有具体框架乘积语义，不等于任意加交互公理。Oφ→[α]Oφ 是额外规范持续性假设，履行、撤销、时间经过等可使之不成立。模块化软件本身不是融合定理的实例证明。",
    "references": [
      {
        "id": "SEP-Combining",
        "title": "Stanford Encyclopedia of Philosophy. Combining Logics.",
        "url": "https://plato.stanford.edu/entries/logic-combining/"
      },
      {
        "id": "SEP-Modal",
        "title": "Stanford Encyclopedia of Philosophy. Modal Logic.",
        "url": "https://plato.stanford.edu/entries/logic-modal/"
      }
    ]
  },
  {
    "id": "D29",
    "name": "元规范自指道义公式",
    "tag": "理论参考（未实现）",
    "formula": "O(Oφ) 是对象语言中的迭代模态，不因嵌套而成为二阶量化",
    "scope": "路线图；迭代模态展示",
    "note": "O(Oφ) 是同一对象语言中的模态迭代，未必是第二阶逻辑（没有量化谓词），也不自动要求元语言。它不能直接翻译成『履行应当』。版本管理与规则审查属于工程治理，不等于实现该公式的模型检查。",
    "references": [
      {
        "id": "SEP-DL",
        "title": "Stanford Encyclopedia of Philosophy. Deontic Logic.",
        "url": "https://plato.stanford.edu/entries/logic-deontic/"
      },
      {
        "id": "SEP-Modal",
        "title": "Stanford Encyclopedia of Philosophy. Modal Logic.",
        "url": "https://plato.stanford.edu/entries/logic-modal/"
      }
    ]
  },
  {
    "id": "D30",
    "name": "超推导道义演算（Superdeduction）",
    "tag": "理论参考（未实现）",
    "formula": "T⊆T′ ⇒ Cn(T)⊆Cn(T′) 描述单调后承；新增例外可撤回结论，须与之区分",
    "scope": "展示；未实现 Superdeduction 或闭包证明器",
    "note": "Superdeduction 的文献主题是把理论公理编译成推理规则；φ** 作为道义标记的具体定义未在项目中给出，不能追认为该文献定理。analyze 对规则独立 map，不迭代新增事实，也不计算理论闭包。T⊆T′⇒Cn(T)⊆Cn(T′) 描述单调后承；它与新增例外可撤回结论的可废止语义不能不加区分地合并。",
    "references": [
      {
        "id": "Superdeduction2007",
        "title": "Brauner, Paul, Clément Houtmann, and Claude Kirchner. Superdeduction at Work. In Rewriting, Computation and Proof, 132–166. Springer. 通常标年 2007。",
        "url": "https://doi.org/10.1007/978-3-540-73147-4_7"
      },
      {
        "id": "Gentzen1935",
        "title": "Gentzen, Gerhard. 1935. Untersuchungen über das logische Schließen. I. Mathematische Zeitschrift 39: 176–210.",
        "url": "https://doi.org/10.1007/BF01201353"
      }
    ]
  }
];
