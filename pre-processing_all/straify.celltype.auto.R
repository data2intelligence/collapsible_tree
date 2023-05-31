
getwd()
setwd("/Users/ygao61/Desktop/PhD-Lab/Cell.lineage.pilot/lineage_visualization")
load(file = "../sce/E-MTAB-6149_NSCLC_meta.rda")

# Extract type info, separately
major = sc.matrix.anno[,"uniformCellType"]
sub = sc.matrix.anno[,"uniformCellTypeSub"]

unique.Type = unique(major)
unique.SubType = unique(sub)

# Extract type and subtype. together.
major.and.sub = sc.matrix.anno[,c("uniformCellType","uniformCellTypeSub")]
Unique.df.type= unique(major.and.sub)
colnames(Unique.df.type) = c('parent',"name")

name = na.omit(unique.Type)

# stratify the majorType and subType from original data
remove.major = unique.Type
name111 = unique.SubType[! unique.SubType %in% remove.major ]
name222 = sort(name111)
name222

# May 13th modification: make plasma a subgroup of B cell(We did in "mean by subgrooup" and also need to change here)
# drop "Macrophage other", drop "Malignant", move pDC--> undecided, remove DC

name222 = name222[! name222 %in% c("Malignant","Macrophage other")]

stratify.original.subtype =data.frame(
  parent = c("B cell","B cell","B cell","B cell","cDC","cDC","cDC",
             "Macrophage","Macrophage","T CD4",
             "T CD8","T CD8","T CD8","T CD8","T CD4","T CD4","T CD4","T CD4","T CD4"),
  name = name222
)

# Add more hierarchy for original Majortype
stratify.original.major = data.frame(
  parent = c("T cell", "T cell", "Myeloid Progenitor","undecided",
             "Monocyte", "undecided", "B cell", "undecided", "Lymphoid Progenitor", 
             "Monocyte","Lymphoid Progenitor","undecided"),
  name = na.omit(unique.Type)
)
# original parent(==Major type)
# "T CD4"       "T CD8"       "Mast"        NA            "Endothelial"
#"Macrophage"  "Malignant"   "Plasma"      "CAF"         "B cell"     
# "cDC"         "NK"          "pDC" 



stratify.extra = data.frame(
  parent = c("Lymphoid Progenitor", "Blood Stem Cell","Myeloblast","Blood Stem Cell",
            "Myeloid Progenitor","Root","Root",NA, "Myeloblast","T CD8"),
  name = c('T cell',"Myeloid Progenitor", "Monocyte","Lymphoid Progenitor",
           "Myeloblast","undecided","Blood Stem Cell","Root", "Neutrophil","T CD8 naive")
)

# Concatenate 3 stratify dfs

all.stratify.anno = rbind(stratify.original.subtype, stratify.original.major)
all.stratify.anno = rbind(all.stratify.anno,stratify.extra)

all.stratify.anno = all.stratify.anno[! all.stratify.anno$name %in% c("Malignant","Macrophage other"),]

lead.node.list = c(na.omit(unique.SubType), "Neutrophil","T CD8 naive")
all.stratify.anno$leaf_node = ifelse(all.stratify.anno$name %in% lead.node.list, 'leaf_node','non_leaf')

write.csv(all.stratify.anno, 
          "pre-processing_all/all.stratify.anno.auto.csv", row.names = FALSE)



\