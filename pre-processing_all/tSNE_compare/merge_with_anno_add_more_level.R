library("dplyr") 
library(tidyr)

setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot")
getwd()

# Load matrix  ## 14 secs  **** row = gene; col = cell barcode. ****
load(file = "data/raw.data/E-MTAB-6149_NSCLC_TPM.rda") 

# start.time <- Sys.time()
# matrix = sc.matrix.data[1:8,]

matrix = sc.matrix.data
matrix_T = as.data.frame(t(matrix)) # Now ***row =cell, col=gene ***
gene_list = colnames(matrix_T)


# Load meta data.  **** row= cell barcode ;col = metadata ****
meta = read.csv("data/csv.data/E-MTAB-6149_NSCLC_meta.csv") 

anno = as.data.frame(meta[,c("uniformCellType", "uniformCellTypeSub")])
colnames(anno) = c("uniformCellType", "uniformCellTypeSub")

# concatenate matrix with anno
merge = cbind(matrix_T,anno) 

#------------------Sub cell type------------------
anno_sub = as.data.frame(meta[,"uniformCellTypeSub"])
colnames(anno_sub) = "uniformCellTypeSub"

# concatenate matrix with anno
merge_sub = cbind(matrix_T,anno_sub) 

# group by Sub cell type, calc mean and size
sub_df = merge_sub %>% group_by(uniformCellTypeSub) %>%
  mutate(sub_size=n())
sub_df = sub_df %>% group_by(uniformCellTypeSub) %>%
  summarise(across(everything(), mean))

# ---whole matrix takes 4.6mins---

# Modification: remove "Malignant", remove NA, make Plasma a subgroup of B cell
sub_df = subset(sub_df,uniformCellTypeSub!= "Malignant" )


#log normalization
len = length(gene_list)
sub_df[,2:(len+1)] = t(apply(sub_df[,2:(len+1)], 1, function(x) log2(x/10+1)))
sub_df[,2:(len+1)] = round(sub_df[,2:(len+1)] , digits = 2)

# get structure of cell types
anno_structure = unique(anno)
anno_structure = anno_structure %>% drop_na(uniformCellTypeSub)
anno_structure[anno_structure$uniformCellTypeSub=='Plasma',"uniformCellType"] = "B cell"

# recover major-sub relationship 
sub_df = merge(x = anno_structure, y = sub_df , by="uniformCellTypeSub", all.y = TRUE)

sub_df = sub_df %>% drop_na(uniformCellTypeSub)
# write.csv(sub_df, file = "data/csv.data/E-MTAB-6149_NSCLC_mean_by_subgroup_all_gene.csv")


#------------------ Add more lineage hierarchies ------------------
level_3 = data.frame('uniformCellType' = c('T CD4','T CD8','cDC','pDC','Mast','Macrophage','NK','B cell','CAF','Endothelial','Plasma'),
                     'level_3' = c('T cell', 'T cell','Myeloid','Myeloid','Myeloid','Myeloid','NK','B cell','CAF','Endothelial','Pasma'))
multi_level_df = merge(x = level_3, y = sub_df, by ="uniformCellType", all.y = TRUE )

gene_list = colnames(multi_level_df)
gene_list = gene_list[5: length(gene_list) -1]
#------------------ Major df ------------------

major_df = multi_level_df %>% group_by(uniformCellType) %>% summarise(child_num = n(), major_size = sum(sub_size))

for (gene in gene_list){
  df = multi_level_df[,c("uniformCellType","sub_size",gene)]
  colnames(df) = c("uniformCellType","sub_size","gene")
  df = df %>% group_by(uniformCellType) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
  major_df = cbind(major_df, df$weighted_mean)
}
colnames(major_df) = c("uniformCellType","child_num", "major_size",gene_list)
write.csv(multi_level_df, file = "data/csv.data/E-MTAB-6149_NSCLC_mean_by_multi_level_all_gene.csv")
write.csv(major_df, file = "data/csv.data/E-MTAB-6149_NSCLC_mean_by_majorgroup_all_gene.csv")
#------------------ Level-3 df ------------------

level_3_df = multi_level_df %>% group_by(level_3) %>% summarise(child_num = n(), level_3_size = sum(sub_size))

for (gene in gene_list){
  df = multi_level_df[,c("level_3","sub_size", gene)]
  colnames(df) = c("level_3","sub_size","gene")
  df = df %>% group_by(level_3) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
  level_3_df = cbind(level_3_df, df$weighted_mean)
}
colnames(level_3_df) = c("level_3","child_num", "level_3_size",gene_list)

# --- 6.69 mins  in total---

#------------------ Scoring- macro  ------------------

level_3_df_test = level_3_df[, c(1:12)]
min_2 = level_3_df %>% filter(level_3 %in% c("T cell","Myeloid") ) %>%
  summarise(across(where(is.numeric), ~min(.x)))
max_other =  level_3_df %>% filter(!level_3 %in% c("T cell","Myeloid") ) %>%
  summarise(across(where(is.numeric), ~max(.x)))

macro_score = rbind(min_2, max_other)
macro_score[3,] = macro_score[1,] -macro_score[2,] 
macro_score = t(apply(macro_score, 1, function(x) x/sum(x)))
#------------------ Scoring- micro  ------------------


micro_brch = function(df, cellType){
  df = df %>% filter( uniformCellType == cellType) 
  min = df %>% summarise(across(where(is.numeric), ~min(.x)))
  max = df %>% summarise(across(where(is.numeric), ~max(.x)))
  return (max-min)
}
micro_brch_lv3 = function(df, cellType){
  df = df %>% filter(level_3 == cellType) 
  min = df %>% summarise(across(where(is.numeric), ~min(.x)))
  max = df %>% summarise(across(where(is.numeric), ~max(.x)))
  return (max-min)
}

sub_df_test = sub_df[, -c(17462)] ## col:17462 = size
micro_brch_df = rbind('micro_T8' = micro_brch(sub_df_test, "T CD8") ,
                        'micro_T4'= micro_brch(sub_df_test, "T CD4"),
                      'micro_Myeloid' = micro_brch_lv3(multi_level_df[,-c(17463)],"Myeloid"))

# normalize every row to 1
micro_brch_df = t(apply(micro_brch_df, 1, function(x) x/sum(x)))

# Get the final score =marco + micro

score_df = rbind(macro_score[3,-c(1,2)], micro_brch_df)
score_df = as.data.frame(t(score_df))
colnames(score_df)[1] = 'macro_score'
score_df = as.data.frame(score_df)
final_df = mutate(score_df, final_T8 = macro_score + micro_T8,
                               final_T4 = macro_score + micro_T4,
                               final_Myeloid = macro_score + micro_Myeloid)

write.csv(final_df, file = "Web-Interface/tSNE_compare/output/final_score.csv")







