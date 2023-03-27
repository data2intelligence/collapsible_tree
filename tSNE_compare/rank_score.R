library(ggplot2)
library(ggpubr)
library(dplyr)
library(tidyr)

setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot")
getwd()

# Loop through all 10 datasets in the sce folder
TPM_file_list <- list.files(path = "sce", pattern = "_TPM.rda")
meta_file_list <- list.files(path = "sce", pattern = "_meta.rda")

for (i in 1:length(TPM_file_list)) {
  i = 2
  TPM_file = TPM_file_list[i]
  meta_file = meta_file_list[i]
  
  # create folder for each datasets
  folder_name = gsub('_TPM.rda','',TPM_file)
  folder_path = paste0("lineage_visualization/tSNE_compare/output_all_datasets/",folder_name )
  
  if(!dir.exists(folder_path)){
    dir.create(folder_path)
  }else{
    print("dir exists")
  }

  # Load matrix   *** row = gene; col = cell barcode ***
  load(file = paste0("sce/", TPM_file))
  matrix <- sc.matrix.data
  matrix_T <- as.data.frame(t(matrix)) # Now ***row = cell, col = gene ***
  gene_list <- colnames(matrix_T)
  
  # Load meta data.  **** row= cell barcode ;col = metadata ****
  # csv vs. load rda ==> in rda, cellbarcode = index;;; csv cellbarcode == #1 col
  load(file = paste0("sce/", meta_file))
  meta <- sc.matrix.anno
  
  anno <- as.data.frame(meta[, c("uniformCellType", "uniformCellTypeSub")])
  colnames(anno) <- c("uniformCellType", "uniformCellTypeSub")
  
  # concatenate matrix with anno
  merge <- cbind(matrix_T, anno)
  print(dim(merge))
  
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
  
  # *** Modification: remove "Malignant", remove NA, make Plasma a subgroup of B cell ***
  sub_df = subset(sub_df,uniformCellTypeSub!= "Malignant" )
  # *** [sub_df col: subcelltype, gene_1,....gene_n, sub_size] ***
  # *** dim(sub_df)[2] == length(gene_list)+2 ***
  
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
  # *** [sub_df --> col: majorcelltype, subcelltype, gene_1,....gene_n, sub_size] ***
  # ***  sub_df --> number of cols = gene list + 3. ***
  # write.csv(sub_df, file = paste0(folder_path,"/mean_by_subgroup_all_gene.csv"))
  
  #------------------ Add more lineage hierarchies ------------------
  level_3 = data.frame('uniformCellType' = c('T CD4','T CD8','cDC','pDC','Mast','Macrophage','NK','B cell','CAF','Endothelial','Plasma'),
                       'level_3' = c('T cell', 'T cell','Myeloid','Myeloid','Myeloid','Myeloid','NK','B cell','CAF','Endothelial','Pasma'))
  multi_level_df = merge(x = level_3, y = sub_df, by ="uniformCellType", all.y = TRUE )
  # *** [multi_level_df --> col: level3celltype, majorcelltype, subcelltype, gene_1,....gene_n, sub_size] ***
  # ***  multi_level_df --> number of cols = gene list + 4. ***
  # write.csv(multi_level_df, file = paste0(folder_path, "/mean_by_multi_level_all_gene.csv"))
  
  #------------------ Major df ------------------
  major_df = multi_level_df %>% group_by(uniformCellType) %>% summarise(child_num = n(), major_size = sum(sub_size))
  
  for (gene in gene_list){
    df = multi_level_df[,c("uniformCellType","sub_size",gene)]
    colnames(df) = c("uniformCellType","sub_size","gene")
    df = df %>% group_by(uniformCellType) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
    major_df = cbind(major_df, df$weighted_mean)
  }
  colnames(major_df) = c("uniformCellType","child_num", "major_size",gene_list)
  # write.csv(major_df, file = paste0(folder_path, "/mean_by_majorgroup_all_gene.csv"))
  
  #------------------ Level-3 df ------------------
  level_3_df = multi_level_df %>% group_by(level_3) %>% summarise(child_num = n(), level_3_size = sum(sub_size))
  
  for (gene in gene_list){
    df = multi_level_df[,c("level_3","sub_size", gene)]
    colnames(df) = c("level_3","sub_size","gene")
    df = df %>% group_by(level_3) %>% summarise(weighted_mean = weighted.mean(gene,sub_size)) 
    level_3_df = cbind(level_3_df, df$weighted_mean)
  }
  colnames(level_3_df) = c("level_3","child_num", "level_3_size",gene_list)
  # *** [level_3_df --> col: as shown in the line above] ***
  # *** level_3_df --> number of cols = gene list + 3. ***
  
  #------------------ Scoring- macro  ------------------
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
  
  col_num_for_size = dim(sub_df)[2] ## last col => size, is numeric
  sub_df_remove_size = sub_df[, -c(col_num_for_size)] 
  
  multi_level_df_remove_size = multi_level_df[,-c(dim(multi_level_df)[2])]
  micro_brch_df = rbind('micro_T8' = micro_brch(sub_df_remove_size, "T CD8") ,
                        'micro_T4'= micro_brch(sub_df_remove_size, "T CD4"),
                        'micro_Myeloid' = micro_brch_lv3(multi_level_df_remove_size,"Myeloid"))
  
  # normalize every row to 1
  micro_brch_df = t(apply(micro_brch_df, 1, function(x) x/sum(x)))
  
  score_df = rbind(macro_score[3,-c(1,2)], micro_brch_df)
  score_df = as.data.frame(t(score_df))
  colnames(score_df)[1] = 'macro_score'
  score_df = as.data.frame(score_df)
  
  #------------------------------------
  # [old method!]Get the final score = marco + micro
  # final_df = mutate(score_df, final_T8 = macro_score + micro_T8,
  #                   final_T4 = macro_score + micro_T4,
  #                   final_Myeloid = macro_score + micro_Myeloid)
  # 
  # write.csv(final_df, file = paste0(folder_path, "/final_score.csv"))
  # 
  # final_score <- read.csv(paste0(folder_path,"/final_score.csv"))
  # rownames(final_score) = final_score$X
  #------------------------------------
  
  #------------------------------------
  # [new method: we display the marco and micro(3 lineage) in 2D plot. 
  # And select the dots in the right-upper corner]
  #------------------------------------
  write.csv(score_df, file = paste0(folder_path, "/score_df.csv"))
  
  folder_name = gsub('_TPM.rda','',TPM_file_list[i])
  folder_path = paste0("lineage_visualization/tSNE_compare/output_all_datasets/",folder_name )

  #------------------------------------
  # [new method: we display the marco and micro(3 lineage) in 2D plot]

  T8 = ggplot(score_df, aes(x = micro_T8, y = macro_score))+
      geom_point()+
      geom_point(aes(x = score_df[c("FIBP"), "micro_T8"],
                   y = score_df["FIBP", "macro_score"], col = "red"))
  
  T4 = ggplot(score_df, aes(x = micro_T4, y = macro_score))+
    geom_point()+
    geom_point(aes(x = score_df[c("FIBP"), "micro_T4"], 
                   y = score_df[c("FIBP"), "macro_score"], col = "red"))+ 
    ggtitle("macro vs lineage score. Marker FIBP in red")
  
  Myeloid = ggplot(score_df, aes(x = micro_Myeloid, y = macro_score))+
    geom_point()+
    geom_point(aes(x = score_df[c("FIBP"), "micro_Myeloid"], 
                   y = score_df[c("FIBP"), "macro_score"], col = "red"))
  
  p <- ggarrange(T8, T4, Myeloid, ncol =3, nrow =1 )
  png(paste0(folder_path,"/score_scatterplot.png"), width = 1000, height = 400)
  print(p)
  dev.off()
  
  m= c("micro_T8", "micro_T4", "micro_Myeloid")
  top_gene = c()
  top_gene_txt = c()
  for (lineage in m){
    top_mtx = filter(score_df, macro_score > 3e-04 & !!as.symbol(lineage) > 3e-04) 
    top_gene_list = list(rownames(top_mtx) )
    top_gene =c(top_gene, top_gene_list)
    top_gene_txt = c(top_gene_txt, lineage, rownames(top_mtx),"\n")
    }
  writeLines(top_gene_txt, paste0(folder_path,"/top_gene.txt"))
  
}






