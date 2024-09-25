
library(ggpubr)
library(ggrepel)
library(dplyr)
library(tidyr)

root_folder = "/Users/ygao61/Desktop/PhD-Lab/Cell.lineage.pilot/"
getwd()

# Loop through all 10 datasets in the sce folder
TPM_file_list <- list.files(path = paste0(root_folder, "sce"), pattern = "_TPM.rda")
meta_file_list <- list.files(path = paste0(root_folder, "sce"), pattern = "_meta.rda")

len = length(TPM_file_list)
for (i in 1:len) {

  TPM_file = TPM_file_list[i]
  meta_file = meta_file_list[i]
  
  # create folder for each datasets
  folder_name = gsub('_TPM.rda','',TPM_file)
  folder_path = paste0(getwd(),"/output_all_datasets/",folder_name )

  if(!dir.exists(folder_path)){
    dir.create(folder_path)
  }else{
    print("dir exists")
  }

  # Load matrix   *** row = gene; col = cell barcode ***
  load(file = paste0(root_folder,"sce/", TPM_file))
  matrix <- sc.matrix.data
  matrix_T <- as.data.frame(t(matrix)) # Now ***row = cell, col = gene ***
  gene_list <- colnames(matrix_T)
  
  # Load meta data.  **** row= cell barcode ;col = metadata ****
  # csv vs. load rda ==> in rda, cellbarcode = index;;; csv cellbarcode == #1 col
  load(file = paste0(root_folder,"sce/", meta_file))
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
  # *** MOdification (07/25/2024): keep "Malignant" ***
  # sub_df = subset(sub_df,uniformCellTypeSub!= "Malignant" )
  sub_df = subset(sub_df,uniformCellTypeSub!= "pDC" )
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
  write.csv(sub_df, file = paste0(folder_path,"/mean_by_subgroup_all_gene.csv"))
  
  col_num_for_size = dim(sub_df)[2] ## last col => size, is numeric
  sub_df = sub_df[, -c(col_num_for_size)] 
  #------------------ Scoring  ------------------

  min_2 = sub_df %>% filter(uniformCellTypeSub %in% c("T CD8 exhausted","Treg") ) %>%
    summarise(across(where(is.numeric), ~min(.x)))
  max_other =  sub_df %>% filter(!uniformCellTypeSub %in% c("T CD8 exhausted","Treg","CAF","Macrophage M2") ) %>%
    summarise(across(where(is.numeric), ~max(.x)))
  
  target_df = rbind(min_2, max_other)
  target_df[3,] = target_df[1,] -target_df[2,] 
  rownames(target_df) = c("min_2","max_other", "target_score")
  target_df = as.data.frame(t(target_df))
  #------------------------------------
  write.csv(target_df, file = paste0(folder_path, "/target_score_df.csv"))

  # If not reading target_score_df.csv, skip the following 2 lines 
  # colnames(target_df)[1] = "gene_name"
  # rownames(target_df) = target_df$gene_name
  

  p999_macro = quantile(target_df$target_score, 0.999)
  filter_gene = filter(target_df, target_score > p999_macro)
  filter_gene = filter_gene[order(filter_gene[,3],decreasing=TRUE),]
  reference_score = target_df[c("PDCD1", "CTLA4"), ]
  reference_score[c("---"),] = c("", "","")
  top_gene_df = rbind(reference_score,filter_gene)
  write.csv(top_gene_df, file = paste0(folder_path, "/target_score_df.csv"))
  
}
  